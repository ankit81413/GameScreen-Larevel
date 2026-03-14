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
            ->with([
                'wallpaper' => function ($query) use ($user) {
                    $query
                        ->select(['id', 'code', 'name', 'thumbnail', 'type', 'orientation'])
                        ->where(function ($visibility) use ($user) {
                            $visibility->where('is_private', false)
                                ->orWhere('owner_id', $user->id);
                        })
                        ->where(function ($visibility) use ($user) {
                            $visibility->where('owner_id', $user->id)
                                ->orWhereHas('links');
                        })
                        ->with(['links' => function ($linkQuery) {
                            $linkQuery->select(['id', 'wallpaper_id', 'quality', 'url']);
                        }]);
                },
            ])
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
        if ((bool) $wallpaper->is_private && (int) $wallpaper->owner_id !== (int) $user->id) {
            return response()->json([
                'saved' => false,
                'message' => 'Private wallpapers cannot be saved.',
            ], 403);
        }
        if (!$wallpaper->links()->exists() && (int) $wallpaper->owner_id !== (int) $user->id) {
            return response()->json([
                'saved' => false,
                'message' => 'Processing wallpapers cannot be saved yet.',
            ], 403);
        }

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
