<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Wallpaper;
use Illuminate\Support\Str;

class DownloadController extends Controller
{
    public function download(Request $request, string $code)
    {
        [$wallpaper, $selectedLink, $requestedQuality] = $this->resolveWallpaperAndLink($request, $code);

        return Inertia::render('Download', [
            'wallpaper' => [
                'code' => $wallpaper->code,
                'name' => $wallpaper->name,
                'thumbnail' => $wallpaper->thumbnail,
            ],
            'requested_quality' => $requestedQuality,
            'download' => [
                'url' => $selectedLink['url'] ?? null,
                'quality' => $selectedLink['quality'] ?? null,
                'force_url' => route('download.file', [
                    'code' => $wallpaper->code,
                    'quality' => $selectedLink['quality'] ?? null,
                ]),
            ],
        ]);
    }

    public function file(Request $request, string $code)
    {
        [$wallpaper, $selectedLink] = $this->resolveWallpaperAndLink($request, $code);

        $downloadUrl = (string) ($selectedLink['url'] ?? '');
        if ($downloadUrl === '') {
            abort(404);
        }

        $urlPath = parse_url($downloadUrl, PHP_URL_PATH) ?: '';
        $extension = pathinfo($urlPath, PATHINFO_EXTENSION);
        $safeName = Str::slug((string) $wallpaper->name) ?: 'wallpaper';
        $fileName = $extension !== '' ? $safeName . '.' . strtolower($extension) : $safeName;

        return response()->streamDownload(function () use ($downloadUrl) {
            $stream = @fopen($downloadUrl, 'rb');
            if ($stream === false) {
                return;
            }

            while (!feof($stream)) {
                echo fread($stream, 8192);
                flush();
            }

            fclose($stream);
        }, $fileName, [
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ]);
    }

    private function resolveWallpaperAndLink(Request $request, string $code): array
    {
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
            ->with('links')
            ->firstOrFail();

        $links = collect($wallpaper->links)
            ->map(function ($link) {
                $qualityValue = $this->parseQualityValue((string) ($link->quality ?? ''));

                return [
                    'quality' => (string) ($link->quality ?? ''),
                    'quality_value' => $qualityValue,
                    'url' => $link->url,
                ];
            })
            ->filter(fn ($link) => $link['quality_value'] > 0 && !empty($link['url']))
            ->sortByDesc('quality_value')
            ->values();

        $requestedQuality = (string) $request->query('quality', '');
        $requestedQualityValue = $this->parseQualityValue($requestedQuality);

        $selectedLink = null;
        if ($requestedQualityValue > 0) {
            $selectedLink = $links->firstWhere('quality_value', $requestedQualityValue);
        }

        if (!$selectedLink) {
            $selectedLink = $links->first();
        }

        return [$wallpaper, $selectedLink, $requestedQuality];
    }

    private function parseQualityValue(string $quality): int
    {
        $normalized = strtolower(trim($quality));

        if ($normalized === '') {
            return 0;
        }

        if (preg_match('/^(\d+)\s*k$/', $normalized, $matches)) {
            $kValue = (int) $matches[1];
            if ($kValue === 2) {
                return 1440;
            }
            if ($kValue === 4) {
                return 2160;
            }
            if ($kValue === 8) {
                return 4320;
            }

            return $kValue * 1000;
        }

        if (preg_match('/^(\d+)\s*p$/', $normalized, $matches)) {
            return (int) $matches[1];
        }

        if (preg_match('/^(\d+)$/', $normalized, $matches)) {
            return (int) $matches[1];
        }

        return 0;
    }
}
