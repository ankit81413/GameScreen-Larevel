<?php

namespace App\Http\Controllers;

use App\Models\SavedWallpaper;
use App\Models\Wallpaper;
use Illuminate\Http\Request;

class SavedWallpaperController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $items = SavedWallpaper::query()
            ->where('user_id', $user->id)
            ->with('wallpaper')
            ->latest('id')
            ->paginate(20);

        return response()->json($items);
    }

    public function toggle(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'wallpaper_id' => ['required', 'integer', 'exists:wallpapers,id'],
        ]);

        $wallpaper = Wallpaper::query()->findOrFail($validated['wallpaper_id']);

        $existing = SavedWallpaper::query()
            ->where('user_id', $user->id)
            ->where('wallpaper_id', $wallpaper->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json([
                'saved' => false,
                'message' => 'Wallpaper removed from saved list.',
            ]);
        }

        SavedWallpaper::query()->create([
            'user_id' => $user->id,
            'wallpaper_id' => $wallpaper->id,
            'wallpaper_code' => $wallpaper->code,
            'wallpaper_name' => $wallpaper->name,
            'wallpaper_thumbnail' => $wallpaper->thumbnail,
            'wallpaper_type' => $wallpaper->type,
        ]);

        return response()->json([
            'saved' => true,
            'message' => 'Wallpaper saved.',
        ]);
    }
}
