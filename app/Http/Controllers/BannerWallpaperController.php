<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;

class BannerWallpaperController extends Controller
{
    private const BANNER_SIZE = 10;

    private const INTEREST_RATIO_COUNT = 6;

    public function index(Request $request)
    {
        $baseQuery = Wallpaper::query()
            ->with(['links'])
            ->where('type', 2)
            ->where('is_private', false)
            ->whereHas('links');

        $user = $request->user();
        $interestWallpapers = collect();

        if ($user) {
            $weights = app(InterestController::class)->weightsForUser((int) $user->id);

            if ($weights->isNotEmpty()) {
                $interestTagIds = $weights->keys()->all();
                $weightCases = [];
                $bindings = [];
                foreach ($weights as $tagId => $weight) {
                    $weightCases[] = 'WHEN wallpaper_tag.tag_id = ? THEN ?';
                    $bindings[] = (int) $tagId;
                    $bindings[] = (int) $weight;
                }

                $tagPlaceholders = implode(',', array_fill(0, count($interestTagIds), '?'));
                $interestWallpapers = (clone $baseQuery)
                    ->whereHas('tags', function ($query) use ($interestTagIds) {
                        $query->whereIn('tags.id', $interestTagIds);
                    })
                    ->orderByRaw(
                        "(
                            SELECT COALESCE(SUM(
                                CASE
                                    ".implode(' ', $weightCases)."
                                    ELSE 0
                                END
                            ), 0)
                            FROM wallpaper_tag
                            WHERE wallpaper_tag.wallpaper_id = wallpapers.id
                              AND wallpaper_tag.tag_id IN ({$tagPlaceholders})
                        ) DESC",
                        [...$bindings, ...$interestTagIds],
                    )
                    ->inRandomOrder()
                    ->limit(self::INTEREST_RATIO_COUNT)
                    ->get();
            }
        }

        $remainingSlots = max(self::BANNER_SIZE - $interestWallpapers->count(), 0);

        $discoverableWallpapers = $remainingSlots > 0
            ? (clone $baseQuery)
                ->when(
                    $interestWallpapers->isNotEmpty(),
                    fn ($query) => $query->whereNotIn('id', $interestWallpapers->pluck('id')),
                )
                ->inRandomOrder()
                ->limit($remainingSlots)
                ->get()
            : collect();

        $bannerWallpapers = $interestWallpapers
            ->concat($discoverableWallpapers)
            ->unique('id')
            ->shuffle()
            ->take(self::BANNER_SIZE)
            ->values();

        return response()->json($bannerWallpapers);
    }
}
