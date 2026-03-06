<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;

class SearchSuggestionController extends Controller
{
    public function index(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            return response()->json([]);
        }

        $terms = collect(preg_split('/\s+/', mb_strtolower($query)))
            ->filter()
            ->unique()
            ->values();

        $wallpapers = Wallpaper::query()
            ->with('links')
            ->where(function ($builder) use ($terms) {
                foreach ($terms as $term) {
                    $builder->orWhereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereHas('tags', function ($tagQuery) use ($term) {
                            $tagQuery->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                        });
                }
            })
            ->orderByRaw('CASE WHEN LOWER(name) LIKE ? THEN 0 WHEN LOWER(name) LIKE ? THEN 1 ELSE 2 END', [
                mb_strtolower($query).'%',
                '%'.mb_strtolower($query).'%',
            ])
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(function ($wallpaper) {
                $maxQuality = collect($wallpaper->links ?? [])
                    ->map(function ($link) {
                        $qualityText = (string) ($link->quality ?? '');
                        if (preg_match('/^(\d+)\s*k$/i', trim($qualityText), $matches)) {
                            return (int) $matches[1] * 1000;
                        }
                        if (preg_match('/(\d+)/', $qualityText, $matches)) {
                            return (int) $matches[1];
                        }

                        return 0;
                    })
                    ->max();

                $qualityLabel = $maxQuality >= 2000
                    ? (int) round($maxQuality / 1000).'k'
                    : ($maxQuality > 0 ? $maxQuality.'p' : '');

                return [
                    'code' => $wallpaper->code,
                    'name' => $wallpaper->name,
                    'thumbnail' => $wallpaper->thumbnail,
                    'quality' => $qualityLabel,
                ];
            })
            ->values();

        return response()->json($wallpapers);
    }
}
