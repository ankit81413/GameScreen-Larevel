<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;

class SimilarWallpaperController extends Controller
{
    private const RECOMMENDED_SIMILAR_CODES = [
        '0007',
        '0038',
        '0012',
        '0029',
        '0003',
        '0038',
        '0017',
        '0021',
        '0009',
        '0030',
        '0014',
    ];

    public function index(Request $request)
    {
        $codes = collect(self::RECOMMENDED_SIMILAR_CODES);
        $page = max((int) $request->query('page', 1), 1);

        $wallpapersByCode = Wallpaper::with(['links', 'tags'])
            ->whereIn('code', $codes->all())
            ->where('is_private', false)
            ->get()
            ->keyBy('code');

        $orderedWallpapers = $codes
            ->map(fn ($code) => $wallpapersByCode->get($code))
            ->filter()
            ->values();

        $nextPageUrl = route('similar.wallpapers', [
            'page' => $page + 1,
        ]);

        return response()->json([
            'data' => $orderedWallpapers,
            'next_page_url' => $nextPageUrl,
        ]);
    }
}
