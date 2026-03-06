<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;

class BannerWallpaperController extends Controller
{
    public function index(Request $request)
    {
        $codesParam = $request->query('codes', []);

        $codes = collect(is_array($codesParam) ? $codesParam : explode(',', (string) $codesParam))
            ->map(fn ($code) => trim((string) $code))
            ->filter()
            ->values();

        if ($codes->isEmpty()) {
            return response()->json([]);
        }

        $wallpapersByCode = Wallpaper::with(['links'])
            ->where('type', 2)
            ->whereIn('code', $codes->all())
            ->get()
            ->keyBy('code');

        $orderedWallpapers = $codes
            ->map(fn ($code) => $wallpapersByCode->get($code))
            ->filter()
            ->values();

        return response()->json($orderedWallpapers);
    }
}
