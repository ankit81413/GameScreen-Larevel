<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use App\Models\WallpaperComment;
use App\Models\WallpaperLike;
use Illuminate\Http\Request;

class WallpaperInteractionController extends Controller
{
    public function toggleLike(Request $request, Wallpaper $wallpaper)
    {
        $user = $request->user();
        if ((bool) $wallpaper->is_private && (int) $wallpaper->owner_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $existing = WallpaperLike::query()
            ->where('user_id', $user->id)
            ->where('wallpaper_id', $wallpaper->id)
            ->first();

        $liked = false;
        if ($existing) {
            $existing->delete();
        } else {
            WallpaperLike::query()->create([
                'user_id' => $user->id,
                'wallpaper_id' => $wallpaper->id,
            ]);
            $liked = true;
        }

        $likesCount = WallpaperLike::query()
            ->where('wallpaper_id', $wallpaper->id)
            ->count();

        return response()->json([
            'liked' => $liked,
            'likes_count' => $likesCount,
        ]);
    }

    public function storeComment(Request $request, Wallpaper $wallpaper)
    {
        if ((bool) $wallpaper->is_private && (int) $wallpaper->owner_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'comment' => ['required', 'string', 'min:1', 'max:500'],
        ]);

        $comment = WallpaperComment::query()->create([
            'user_id' => $request->user()->id,
            'wallpaper_id' => $wallpaper->id,
            'comment' => trim($validated['comment']),
        ]);

        $comment->load('user:id,name,username');

        $commentsCount = WallpaperComment::query()
            ->where('wallpaper_id', $wallpaper->id)
            ->count();

        return response()->json([
            'comment' => [
                'id' => $comment->id,
                'comment' => $comment->comment,
                'created_at' => optional($comment->created_at)->toISOString(),
                'can_delete' => true,
                'user' => [
                    'id' => $comment->user?->id,
                    'name' => $comment->user?->name,
                    'username' => $comment->user?->username,
                ],
            ],
            'comments_count' => $commentsCount,
        ]);
    }

    public function destroyComment(Request $request, WallpaperComment $comment)
    {
        $user = $request->user();
        if ((int) $comment->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $wallpaperId = (int) $comment->wallpaper_id;
        $comment->delete();

        $commentsCount = WallpaperComment::query()
            ->where('wallpaper_id', $wallpaperId)
            ->count();

        return response()->json([
            'ok' => true,
            'comments_count' => $commentsCount,
        ]);
    }
}
