<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\SavedWallpaper;
use App\Models\WallpaperComment;
use App\Models\WallpaperLike;
use App\Models\Wallpaper;

class ViewPageController extends Controller
{
    public function view(Request $request, $code){

        $wallpaper = Wallpaper::where('code', $code)
            ->where(function ($query) use ($request) {
                if ($request->user()) {
                    $query->where('owner_id', $request->user()->id)
                        ->orWhere(function ($publicQuery) {
                            $publicQuery->where('is_private', false)
                                ->whereHas('links');
                        });
                    return;
                }

                $query->where('is_private', false)
                    ->whereHas('links');
            })
            ->with([
                'links',
                'tags',
                'owner:id,name,username',
            ])
            ->firstOrFail();

        if ($request->user()) {
            app(InterestController::class)->recordWallpaperView(
                (int) $request->user()->id,
                $wallpaper,
            );
        }

        $isSaved = false;
        if ($request->user()) {
            $isSaved = SavedWallpaper::query()
                ->where('user_id', $request->user()->id)
                ->where('wallpaper_id', $wallpaper->id)
                ->exists();
        }
        $wallpaper->setAttribute('is_saved', $isSaved);
        $likesCount = WallpaperLike::query()
            ->where('wallpaper_id', $wallpaper->id)
            ->count();

        $isLiked = false;
        if ($request->user()) {
            $isLiked = WallpaperLike::query()
                ->where('user_id', $request->user()->id)
                ->where('wallpaper_id', $wallpaper->id)
                ->exists();
        }

        $comments = WallpaperComment::query()
            ->where('wallpaper_id', $wallpaper->id)
            ->with('user:id,name,username')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(function ($comment) use ($request) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'created_at' => optional($comment->created_at)->toISOString(),
                    'can_delete' => $request->user() && (int) $comment->user_id === (int) $request->user()->id,
                    'user' => [
                        'id' => $comment->user?->id,
                        'name' => $comment->user?->name,
                        'username' => $comment->user?->username,
                    ],
                ];
            })
            ->values();

        $wallpaper->setAttribute('likes_count', $likesCount);
        $wallpaper->setAttribute('is_liked', $isLiked);
        $wallpaper->setAttribute('comments_count', $comments->count());
        $wallpaper->setAttribute('comments', $comments);

        return Inertia::render('view',[
            'canRegister'=>Features::enabled(Features::registration()),
            'wallpaper' => $wallpaper,
              
        ]);
    }
}
