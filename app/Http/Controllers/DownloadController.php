<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Wallpaper;

class DownloadController extends Controller
{
    public function download(Request $request, string $code)
    {
        $wallpaper = Wallpaper::where('code', $code)->with('links')->firstOrFail();

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
            ],
        ]);
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
