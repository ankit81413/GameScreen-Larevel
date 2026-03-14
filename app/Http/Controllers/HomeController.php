<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;
use inertia\Inertia;
use Laravel\Fortify\Features;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $seed = $this->resolveHomeFeedSeed($request);
        $wallpapers = $this->buildHomeWallpaperQuery($request)
            ->paginate(10);
        $wallpapers->withPath(route('wallpapers.paginate'));
        $wallpapers->appends(['seed' => $seed]);

        return Inertia::render('home', [
            'canRegister' => Features::enabled(Features::registration()),
            'wallpapers' => $wallpapers,
        ]);
    }

    public function Loadmore(Request $request)
    {
        $seed = $this->resolveHomeFeedSeed($request);
        $wallpapers = $this->buildHomeWallpaperQuery($request)
            ->paginate(10);
        $wallpapers->withPath(route('wallpapers.paginate'));
        $wallpapers->appends(['seed' => $seed]);

        return response()->json($wallpapers);
    }

    private function buildHomeWallpaperQuery(Request $request)
    {
        $query = Wallpaper::with(['links', 'tags'])
            ->where('is_private', false)
            ->whereHas('links');

        $user = $request->user();
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
                $query->orderByRaw(
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
                );
            }
        }

        $query->orderByRaw(
            "SHA2(CONCAT(?, '-', wallpapers.id), 256)",
            [$this->resolveHomeFeedSeed($request)],
        );

        return $query;
    }

    private function resolveHomeFeedSeed(Request $request): string
    {
        $seed = trim((string) $request->query('seed', ''));
        if ($seed !== '') {
            return $seed;
        }

        return (string) str()->uuid();
    }
}
