<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AutoSearchController extends Controller
{
    private function applySearchFilter($queryBuilder, string $searchQuery)
    {
        $searchQuery = trim($searchQuery);
        if ($searchQuery === '') {
            return $queryBuilder;
        }

        $terms = collect(preg_split('/\s+/', mb_strtolower($searchQuery)))
            ->filter()
            ->unique()
            ->values();

        return $queryBuilder->where(function ($builder) use ($terms) {
            foreach ($terms as $term) {
                $builder->orWhereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                    ->orWhereHas('tags', function ($tagBuilder) use ($term) {
                        $tagBuilder->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                    });
            }
        });
    }

    private function applyRelevanceSort($queryBuilder, string $searchQuery)
    {
        $searchQuery = mb_strtolower(trim($searchQuery));
        if ($searchQuery === '') {
            return $queryBuilder->latest('id');
        }

        return $queryBuilder
            ->orderByRaw(
                'CASE
                    WHEN LOWER(name) = ? THEN 0
                    WHEN LOWER(name) LIKE ? THEN 1
                    WHEN LOWER(name) LIKE ? THEN 2
                    WHEN EXISTS (
                        SELECT 1
                        FROM tags
                        INNER JOIN tag_wallpaper ON tag_wallpaper.tag_id = tags.id
                        WHERE tag_wallpaper.wallpaper_id = wallpapers.id
                          AND LOWER(tags.name) LIKE ?
                    ) THEN 3
                    ELSE 4
                END',
                [
                    $searchQuery,
                    $searchQuery.'%',
                    '%'.$searchQuery.'%',
                    '%'.$searchQuery.'%',
                ]
            )
            ->latest('id');
    }

    public function index(Request $request)
    {
        $searchQuery = (string) $request->query('search', '');
        $wallpapers = Wallpaper::with(['links', 'tags']);
        $wallpapers = $this->applySearchFilter($wallpapers, $searchQuery);
        $wallpapers = $this->applyRelevanceSort($wallpapers, $searchQuery)
            ->paginate(10)
            ->appends(['search' => $searchQuery]);
        $wallpapers->withPath(route('auto-search.paginate'));

        return Inertia::render('auto-search', [
            'search' => $searchQuery,
            'wallpapers' => $wallpapers,
        ]);
    }

    public function loadmore(Request $request)
    {
        $searchQuery = (string) $request->query('search', '');
        $wallpapers = Wallpaper::with(['links', 'tags']);
        $wallpapers = $this->applySearchFilter($wallpapers, $searchQuery);
        $wallpapers = $this->applyRelevanceSort($wallpapers, $searchQuery)
            ->paginate(10)
            ->appends(['search' => $searchQuery]);
        $wallpapers->withPath(route('auto-search.paginate'));

        return response()->json($wallpapers);
    }
}
