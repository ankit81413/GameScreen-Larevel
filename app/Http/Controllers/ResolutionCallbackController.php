<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResolutionCallbackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $expectedToken = config('resolution_service.callback_token');
        $receivedToken = (string) $request->header('X-Resolution-Callback-Token', '');
        if ($expectedToken === '' || !hash_equals($expectedToken, $receivedToken)) {
            return response()->json(['message' => 'Unauthorized callback token.'], 401);
        }

        $payload = $request->validate([
            'wallpaper_id' => ['required', 'integer', 'exists:wallpapers,id'],
            'thumbnail_url' => ['required', 'string', 'max:2048'],
            'quality_thumbnail_url' => ['required', 'string', 'max:2048'],
            'links' => ['required', 'array', 'min:1'],
            'links.*.quality' => ['required', 'string', 'max:32'],
            'links.*.size' => ['required', 'string', 'max:32'],
            'links.*.url' => ['required', 'string', 'max:2048'],
        ]);

        $wallpaper = Wallpaper::query()->findOrFail((int) $payload['wallpaper_id']);
        $wallpaper->forceFill([
            'thumbnail' => $payload['thumbnail_url'],
            'quality_thumbnail' => $payload['quality_thumbnail_url'],
        ])->save();

        $wallpaper->links()->delete();
        $wallpaper->links()->createMany($payload['links']);

        return response()->json(['ok' => true]);
    }
}

