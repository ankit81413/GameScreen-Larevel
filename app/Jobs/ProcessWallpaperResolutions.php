<?php

namespace App\Jobs;

use App\Models\Wallpaper;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ProcessWallpaperResolutions implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 1200;

    public function __construct(
        public int $wallpaperId,
        public string $sourceRelativePath,
        public string $sourceMimeType,
        public ?string $thumbnailSourceRelativePath = null,
    ) {}

    public function handle(): void
    {
        if (!config('resolution_service.enabled')) {
            return;
        }

        $wallpaper = Wallpaper::query()->find($this->wallpaperId);
        if (!$wallpaper) {
            return;
        }

        $diskName = (string) config('resolution_service.source_disk', 'public');
        $disk = Storage::disk($diskName);
        $sourceAbsolutePath = $disk->path($this->sourceRelativePath);
        $thumbnailSourceAbsolutePath = $this->thumbnailSourceRelativePath
            ? $disk->path($this->thumbnailSourceRelativePath)
            : null;

        $requestToken = (string) config('resolution_service.request_token');
        $callbackToken = (string) config('resolution_service.callback_token');
        $serviceUrl = (string) config('resolution_service.base_url');
        $callbackUrl = rtrim((string) config('app.url'), '/').'/api/internal/resolution-callback';

        Http::timeout(300)
            ->withHeaders([
                'X-Resolution-Request-Token' => $requestToken,
                'Accept' => 'application/json',
            ])
            ->post($serviceUrl.'/process', [
                'wallpaper_id' => $wallpaper->id,
                'source_path' => $sourceAbsolutePath,
                'source_relative_path' => $this->sourceRelativePath,
                'source_mime_type' => $this->sourceMimeType,
                'thumbnail_source_path' => $thumbnailSourceAbsolutePath,
                'callback_url' => $callbackUrl,
                'callback_token' => $callbackToken,
            ])->throw();
    }
}

