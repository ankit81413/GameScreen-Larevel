<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWallpaperResolutions;
use App\Models\Tag;
use App\Models\Wallpaper;
use App\Models\WallpaperLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UploadWallpaperController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('upload');
    }

    public function mine(Request $request)
    {
        $user = $request->user();

        $items = Wallpaper::query()
            ->where('owner_id', $user->id)
            ->with(['links' => function ($query) {
                $query->select(['id', 'wallpaper_id', 'quality', 'url']);
            }])
            ->withCount('links')
            ->latest('id')
            ->limit(60)
            ->get(['id', 'code', 'name', 'thumbnail', 'type', 'orientation', 'is_private'])
            ->map(function (Wallpaper $wallpaper) {
                return [
                    'id' => $wallpaper->id,
                    'code' => $wallpaper->code,
                    'name' => $wallpaper->name,
                    'thumbnail' => $wallpaper->thumbnail,
                    'type' => $wallpaper->type,
                    'orientation' => $wallpaper->orientation,
                    'is_private' => $wallpaper->is_private,
                    'links' => $wallpaper->links,
                    'processing' => $wallpaper->links_count === 0,
                ];
            })
            ->values();

        return response()->json($items);
    }

    public function mineArchived(Request $request)
    {
        $user = $request->user();

        $items = Wallpaper::onlyTrashed()
            ->where('owner_id', $user->id)
            ->with(['links' => function ($query) {
                $query->select(['id', 'wallpaper_id', 'quality', 'url']);
            }])
            ->withCount('links')
            ->latest('deleted_at')
            ->limit(60)
            ->get(['id', 'code', 'name', 'thumbnail', 'type', 'orientation', 'is_private', 'deleted_at'])
            ->map(function (Wallpaper $wallpaper) {
                return [
                    'id' => $wallpaper->id,
                    'code' => $wallpaper->code,
                    'name' => $wallpaper->name,
                    'thumbnail' => $wallpaper->thumbnail,
                    'type' => $wallpaper->type,
                    'orientation' => $wallpaper->orientation,
                    'is_private' => $wallpaper->is_private,
                    'deleted_at' => $wallpaper->deleted_at,
                    'links' => $wallpaper->links,
                    'processing' => $wallpaper->links_count === 0,
                ];
            })
            ->values();

        return response()->json($items);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'integer', 'in:1,2'],
            'orientation' => ['nullable', 'string', 'in:land,port'],
            'tags' => ['nullable', 'string', 'max:500'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov', 'max:512000'],
            'thumbnail' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:51200'],
        ]);

        $user = $request->user();
        $useExternalResolutionService = (bool) config('resolution_service.enabled');
        $queuedResolutionPayload = null;

        DB::beginTransaction();
        try {
            $code = $this->generateNextWallpaperCode();

            $file = $validated['file'];
            $filePath = $file->store('wallpapers/uploads', 'public');
            $fileUrl = Storage::url($filePath);
            $fileSizeKb = max(1, (int) round($file->getSize() / 1024));
            $fileMimeType = (string) $file->getMimeType();
            $fileAbsolutePath = Storage::disk('public')->path($filePath);
            $resolvedType = isset($validated['type'])
                ? (int) $validated['type']
                : $this->detectWallpaperType($fileMimeType);
            $resolvedOrientation = isset($validated['orientation'])
                ? (string) $validated['orientation']
                : $this->detectWallpaperOrientation($fileAbsolutePath, $resolvedType, $fileMimeType);
            $thumbnailSourceRelativePath = null;
            if (!empty($validated['thumbnail'])) {
                $thumbnailSourceRelativePath = $validated['thumbnail']
                    ->store('wallpapers/uploads/thumbnails/source', 'public');
            }
            $thumbnailUrl = $fileUrl;
            $qualityThumbnailUrl = $fileUrl;

            if (!$useExternalResolutionService) {
                $thumbAssets = $this->prepareThumbnailAssets(
                    uploadedRelativePath: $filePath,
                    uploadedUrl: $fileUrl,
                    uploadedMimeType: $fileMimeType,
                    thumbnailSourceRelativePath: $thumbnailSourceRelativePath,
                );
                $thumbnailUrl = $thumbAssets['thumbnail_url'];
                $qualityThumbnailUrl = $thumbAssets['quality_thumbnail_url'];
            }

            $wallpaper = null;
            for ($attempt = 0; $attempt < 5; $attempt++) {
                $code = $this->generateNextWallpaperCode();
                try {
                    $wallpaper = Wallpaper::query()->create([
                        'owner_id' => $user->id,
                        'is_private' => false,
                        'code' => $code,
                        'name' => $validated['name'],
                        'thumbnail' => $thumbnailUrl,
                        'quality_thumbnail' => $qualityThumbnailUrl,
                        'type' => $resolvedType,
                        'orientation' => $resolvedOrientation,
                    ]);
                    break;
                } catch (UniqueConstraintViolationException $exception) {
                    if ($attempt === 4) {
                        throw $exception;
                    }
                }
            }

            if (!$wallpaper) {
                throw new \RuntimeException('Could not allocate unique wallpaper code.');
            }

            if ($useExternalResolutionService) {
                $queuedResolutionPayload = [
                    'wallpaper_id' => $wallpaper->id,
                    'source_relative_path' => $filePath,
                    'source_mime_type' => $fileMimeType,
                    'thumbnail_source_relative_path' => $thumbnailSourceRelativePath,
                ];
            } else {
                $this->createLinksFromUploadedFile(
                    wallpaper: $wallpaper,
                    storedRelativePath: $filePath,
                    fileUrl: $fileUrl,
                    fileSizeKb: $fileSizeKb,
                    mimeType: $fileMimeType,
                );
            }

            $tagIds = $this->resolveTags($validated['tags'] ?? '');
            if (!empty($tagIds)) {
                $wallpaper->tags()->sync($tagIds);
            }

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }

        if ($queuedResolutionPayload) {
            ProcessWallpaperResolutions::dispatch(
                wallpaperId: (int) $queuedResolutionPayload['wallpaper_id'],
                sourceRelativePath: (string) $queuedResolutionPayload['source_relative_path'],
                sourceMimeType: (string) $queuedResolutionPayload['source_mime_type'],
                thumbnailSourceRelativePath: $queuedResolutionPayload['thumbnail_source_relative_path']
                    ? (string) $queuedResolutionPayload['thumbnail_source_relative_path']
                    : null,
            );
        }

        return redirect('/account');
    }

    private function createLinksFromUploadedFile(
        Wallpaper $wallpaper,
        string $storedRelativePath,
        string $fileUrl,
        int $fileSizeKb,
        string $mimeType,
    ): void {
        $standards = [4320, 2160, 1440, 1080, 720, 480];
        $disk = Storage::disk('public');
        $absolutePath = $disk->path($storedRelativePath);

        if (!Str::startsWith($mimeType, 'image/')) {
            $this->createVideoLinks(
                wallpaper: $wallpaper,
                storedRelativePath: $storedRelativePath,
                fileUrl: $fileUrl,
                fileSizeKb: $fileSizeKb,
            );
            return;
        }

        [$width, $height] = $this->safeImageSize($absolutePath);
        if ($width < 1 || $height < 1) {
            WallpaperLink::query()->create([
                'wallpaper_id' => $wallpaper->id,
                'quality' => '1080',
                'size' => $fileSizeKb.'kb',
                'url' => $fileUrl,
            ]);
            return;
        }

        $baseQuality = $this->resolveClosestStandardQuality($height, $standards);

        WallpaperLink::query()->create([
            'wallpaper_id' => $wallpaper->id,
            'quality' => (string) $baseQuality,
            'size' => $fileSizeKb.'kb',
            'url' => $fileUrl,
        ]);

        $lowerTargets = collect($standards)
            ->filter(fn ($value) => $value < $baseQuality)
            ->values();

        foreach ($lowerTargets as $targetHeight) {
            $variant = $this->createImageVariant(
                sourcePath: $absolutePath,
                sourceRelativePath: $storedRelativePath,
                mimeType: $mimeType,
                targetHeight: (int) $targetHeight,
            );

            if (!$variant) {
                continue;
            }

            WallpaperLink::query()->create([
                'wallpaper_id' => $wallpaper->id,
                'quality' => (string) $targetHeight,
                'size' => $variant['size_kb'].'kb',
                'url' => $variant['url'],
            ]);
        }
    }

    /**
     * @return array{thumbnail_url:string,quality_thumbnail_url:string}
     */
    private function prepareThumbnailAssets(
        string $uploadedRelativePath,
        string $uploadedUrl,
        string $uploadedMimeType,
        ?string $thumbnailSourceRelativePath = null,
    ): array {
        $sourceRelativePath = null;
        $sourceMimeType = null;

        if ($thumbnailSourceRelativePath) {
            $sourceRelativePath = $thumbnailSourceRelativePath;
            $detectedSourceMimeType = @mime_content_type(Storage::disk('public')->path($thumbnailSourceRelativePath));
            $sourceMimeType = is_string($detectedSourceMimeType) ? $detectedSourceMimeType : 'image/jpeg';
        } elseif (Str::startsWith($uploadedMimeType, 'image/')) {
            $sourceRelativePath = $uploadedRelativePath;
            $sourceMimeType = $uploadedMimeType;
        } elseif ($this->hasFfmpeg()) {
            $frame = $this->extractVideoFrame($uploadedRelativePath);
            if ($frame) {
                $sourceRelativePath = $frame;
                $sourceMimeType = 'image/jpeg';
            }
        }

        if (!$sourceRelativePath || !$sourceMimeType || !Str::startsWith($sourceMimeType, 'image/')) {
            return [
                'thumbnail_url' => $uploadedUrl,
                'quality_thumbnail_url' => $uploadedUrl,
            ];
        }

        $sourceAbsolutePath = Storage::disk('public')->path($sourceRelativePath);
        $sourceUrl = Storage::url($sourceRelativePath);

        $thumb480 = $this->createConstrainedThumbnailVariant(
            sourcePath: $sourceAbsolutePath,
            sourceRelativePath: $sourceRelativePath,
            mimeType: $sourceMimeType,
            targetHeight: 480,
            maxSizeKb: 50,
            suffix: 'thumb',
        );
        $thumb720 = $this->createConstrainedThumbnailVariant(
            sourcePath: $sourceAbsolutePath,
            sourceRelativePath: $sourceRelativePath,
            mimeType: $sourceMimeType,
            targetHeight: 720,
            maxSizeKb: 140,
            suffix: 'quality_thumb',
        );

        return [
            'thumbnail_url' => $thumb480['url'] ?? $sourceUrl,
            'quality_thumbnail_url' => $thumb720['url'] ?? ($thumb480['url'] ?? $sourceUrl),
        ];
    }

    private function createVideoLinks(
        Wallpaper $wallpaper,
        string $storedRelativePath,
        string $fileUrl,
        int $fileSizeKb,
    ): void {
        $disk = Storage::disk('public');
        $absolutePath = $disk->path($storedRelativePath);
        $standards = [4320, 2160, 1440, 1080, 720, 480];

        if (!$this->hasFfmpeg()) {
            WallpaperLink::query()->create([
                'wallpaper_id' => $wallpaper->id,
                'quality' => '1080',
                'size' => $fileSizeKb.'kb',
                'url' => $fileUrl,
            ]);
            return;
        }

        $height = $this->detectVideoHeight($absolutePath);
        if ($height <= 0) {
            WallpaperLink::query()->create([
                'wallpaper_id' => $wallpaper->id,
                'quality' => '1080',
                'size' => $fileSizeKb.'kb',
                'url' => $fileUrl,
            ]);
            return;
        }

        $baseQuality = $this->resolveClosestStandardQuality($height, $standards);

        WallpaperLink::query()->create([
            'wallpaper_id' => $wallpaper->id,
            'quality' => (string) $baseQuality,
            'size' => $fileSizeKb.'kb',
            'url' => $fileUrl,
        ]);

        $lowerTargets = collect($standards)
            ->filter(fn ($value) => $value < $baseQuality)
            ->values();

        foreach ($lowerTargets as $targetHeight) {
            $variant = $this->createVideoVariant(
                sourcePath: $absolutePath,
                sourceRelativePath: $storedRelativePath,
                targetHeight: (int) $targetHeight,
            );

            if (!$variant) {
                continue;
            }

            WallpaperLink::query()->create([
                'wallpaper_id' => $wallpaper->id,
                'quality' => (string) $targetHeight,
                'size' => $variant['size_kb'].'kb',
                'url' => $variant['url'],
            ]);
        }
    }

    private function hasFfmpeg(): bool
    {
        $output = [];
        $exitCode = 1;
        @exec('ffmpeg -version 2>NUL', $output, $exitCode);

        return $exitCode === 0;
    }

    private function detectVideoHeight(string $absolutePath): int
    {
        $command = 'ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 '
            .escapeshellarg($absolutePath).' 2>NUL';

        $output = [];
        $exitCode = 1;
        @exec($command, $output, $exitCode);
        if ($exitCode !== 0 || empty($output)) {
            return 0;
        }

        return max(0, (int) trim((string) $output[0]));
    }

    private function detectVideoDimensions(string $absolutePath): array
    {
        $command = 'ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 '
            .escapeshellarg($absolutePath).' 2>NUL';

        $output = [];
        $exitCode = 1;
        @exec($command, $output, $exitCode);
        if ($exitCode !== 0 || empty($output)) {
            return [0, 0];
        }

        $raw = trim((string) $output[0]);
        if (!preg_match('/^(\d+)x(\d+)$/', $raw, $matches)) {
            return [0, 0];
        }

        return [(int) $matches[1], (int) $matches[2]];
    }

    private function detectWallpaperType(string $mimeType): int
    {
        return Str::startsWith($mimeType, 'video/') ? 2 : 1;
    }

    private function detectWallpaperOrientation(string $absolutePath, int $type, string $mimeType): string
    {
        if ($type === 2) {
            [$width, $height] = $this->detectVideoDimensions($absolutePath);
            if ($width > 0 && $height > 0) {
                return $width >= $height ? 'land' : 'port';
            }

            return 'land';
        }

        [$width, $height] = $this->safeImageSize($absolutePath);
        if ($width > 0 && $height > 0) {
            return $width >= $height ? 'land' : 'port';
        }

        if (Str::startsWith($mimeType, 'video/')) {
            [$videoWidth, $videoHeight] = $this->detectVideoDimensions($absolutePath);
            if ($videoWidth > 0 && $videoHeight > 0) {
                return $videoWidth >= $videoHeight ? 'land' : 'port';
            }
        }

        return 'land';
    }

    private function normalizeImageMimeType(string $mimeType): string
    {
        $normalized = strtolower(trim($mimeType));

        return match ($normalized) {
            'image/jpg', 'image/pjpeg' => 'image/jpeg',
            'image/x-png' => 'image/png',
            default => $normalized,
        };
    }

    private function createImageResource(string $mimeType, string $sourcePath)
    {
        $normalized = $this->normalizeImageMimeType($mimeType);

        $resource = match ($normalized) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => function_exists('imagecreatefromwebp')
                ? @imagecreatefromwebp($sourcePath)
                : false,
            default => false,
        };

        if ($resource) {
            return $resource;
        }

        $binary = @file_get_contents($sourcePath);
        if ($binary === false) {
            return false;
        }

        return @imagecreatefromstring($binary);
    }

    /**
     * Generates a JPEG thumbnail under a max size budget.
     * @return array{url:string,size_kb:int}|null
     */
    private function createConstrainedThumbnailVariant(
        string $sourcePath,
        string $sourceRelativePath,
        string $mimeType,
        int $targetHeight,
        int $maxSizeKb,
        string $suffix,
    ): ?array {
        [$srcWidth, $srcHeight] = $this->safeImageSize($sourcePath);
        if ($srcWidth < 1 || $srcHeight < 1 || $targetHeight <= 0) {
            return null;
        }

        $sourceImage = $this->createImageResource($mimeType, $sourcePath);
        if (!$sourceImage) {
            return null;
        }

        $relativeDir = trim(dirname($sourceRelativePath), '.\\/').'/thumbnails/optimized';
        $baseName = pathinfo($sourceRelativePath, PATHINFO_FILENAME);
        Storage::disk('public')->makeDirectory($relativeDir);

        $maxBytes = max(1, $maxSizeKb) * 1024;
        $qualities = [82, 74, 66, 58, 50, 44, 38, 32, 26, 20, 16, 12, 9, 6];
        $currentHeight = min($targetHeight, $srcHeight);
        $bestBytes = 0;
        $bestRelativePath = null;

        while ($currentHeight >= 120) {
            $targetWidth = max(1, (int) round(($srcWidth * $currentHeight) / $srcHeight));
            $targetImage = imagecreatetruecolor($targetWidth, $currentHeight);
            if (!$targetImage) {
                break;
            }

            imagecopyresampled(
                $targetImage,
                $sourceImage,
                0,
                0,
                0,
                0,
                $targetWidth,
                $currentHeight,
                $srcWidth,
                $srcHeight,
            );

            foreach ($qualities as $quality) {
                $variantRelativePath = sprintf(
                    '%s/%s_%s.jpg',
                    $relativeDir,
                    $baseName,
                    $suffix,
                );
                $variantAbsolutePath = Storage::disk('public')->path($variantRelativePath);
                $saved = @imagejpeg($targetImage, $variantAbsolutePath, $quality);

                if (!$saved || !is_file($variantAbsolutePath)) {
                    continue;
                }

                $bytes = (int) (@filesize($variantAbsolutePath) ?: 0);
                if ($bytes > 0 && ($bestBytes === 0 || $bytes < $bestBytes)) {
                    $bestBytes = $bytes;
                    $bestRelativePath = $variantRelativePath;
                }

                if ($bytes > 0 && $bytes <= $maxBytes) {
                    imagedestroy($targetImage);
                    imagedestroy($sourceImage);

                    return [
                        'url' => Storage::url($variantRelativePath),
                        'size_kb' => max(1, (int) round($bytes / 1024)),
                    ];
                }
            }

            imagedestroy($targetImage);
            $nextHeight = (int) floor($currentHeight * 0.88);
            if ($nextHeight >= $currentHeight) {
                break;
            }
            $currentHeight = $nextHeight;
        }

        imagedestroy($sourceImage);

        if ($bestRelativePath && $bestBytes > 0) {
            return [
                'url' => Storage::url($bestRelativePath),
                'size_kb' => max(1, (int) round($bestBytes / 1024)),
            ];
        }

        return null;
    }

    private function extractVideoFrame(string $sourceRelativePath): ?string
    {
        $sourceAbsolutePath = Storage::disk('public')->path($sourceRelativePath);
        $relativeDir = trim(dirname($sourceRelativePath), '.\\/').'/thumbnails';
        $baseName = pathinfo($sourceRelativePath, PATHINFO_FILENAME);
        $frameRelativePath = $relativeDir.'/'.$baseName.'_frame.jpg';
        Storage::disk('public')->makeDirectory($relativeDir);
        $frameAbsolutePath = Storage::disk('public')->path($frameRelativePath);

        $command = 'ffmpeg -y -i '.escapeshellarg($sourceAbsolutePath)
            .' -ss 00:00:01 -vframes 1 '
            .escapeshellarg($frameAbsolutePath).' 2>NUL';

        $output = [];
        $exitCode = 1;
        @exec($command, $output, $exitCode);
        if ($exitCode !== 0 || !is_file($frameAbsolutePath)) {
            return null;
        }

        return $frameRelativePath;
    }

    /**
     * @return array{url:string,size_kb:int}|null
     */
    private function createVideoVariant(
        string $sourcePath,
        string $sourceRelativePath,
        int $targetHeight,
    ): ?array {
        if ($targetHeight <= 0) {
            return null;
        }

        $relativeDir = trim(dirname($sourceRelativePath), '.\\/').'/variants';
        $baseName = pathinfo($sourceRelativePath, PATHINFO_FILENAME);
        $variantRelativePath = $relativeDir.'/'.$baseName.'_'.$targetHeight.'.mp4';
        Storage::disk('public')->makeDirectory($relativeDir);
        $variantAbsolutePath = Storage::disk('public')->path($variantRelativePath);

        $command = 'ffmpeg -y -i '.escapeshellarg($sourcePath)
            .' -vf '.escapeshellarg('scale=-2:'.$targetHeight)
            .' -c:v libx264 -preset veryfast -crf 23 -movflags +faststart -an '
            .escapeshellarg($variantAbsolutePath).' 2>NUL';

        $output = [];
        $exitCode = 1;
        @exec($command, $output, $exitCode);
        if ($exitCode !== 0 || !is_file($variantAbsolutePath)) {
            return null;
        }

        $variantSizeKb = max(1, (int) round((@filesize($variantAbsolutePath) ?: 0) / 1024));

        return [
            'url' => Storage::url($variantRelativePath),
            'size_kb' => $variantSizeKb,
        ];
    }

    /**
     * @return array{0:int,1:int}
     */
    private function safeImageSize(string $absolutePath): array
    {
        $size = @getimagesize($absolutePath);
        if (!is_array($size)) {
            return [0, 0];
        }

        return [(int) ($size[0] ?? 0), (int) ($size[1] ?? 0)];
    }

    /**
     * @return array{url:string,size_kb:int}|null
     */
    private function createImageVariant(
        string $sourcePath,
        string $sourceRelativePath,
        string $mimeType,
        int $targetHeight,
        array $options = [],
    ): ?array {
        $mimeType = $this->normalizeImageMimeType($mimeType);
        [$srcWidth, $srcHeight] = $this->safeImageSize($sourcePath);
        if ($srcWidth < 1 || $srcHeight < 1 || $targetHeight <= 0 || $targetHeight >= $srcHeight) {
            return null;
        }

        $sourceImage = $this->createImageResource($mimeType, $sourcePath);

        if (!$sourceImage) {
            return null;
        }

        $targetWidth = max(1, (int) round(($srcWidth * $targetHeight) / $srcHeight));
        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);
        if (!$targetImage) {
            imagedestroy($sourceImage);
            return null;
        }

        if ($mimeType === 'image/png' || $mimeType === 'image/webp') {
            imagealphablending($targetImage, false);
            imagesavealpha($targetImage, true);
            $transparent = imagecolorallocatealpha($targetImage, 0, 0, 0, 127);
            imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);
        }

        imagecopyresampled(
            $targetImage,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $srcWidth,
            $srcHeight,
        );

        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };
        $relativeDir = trim(dirname($sourceRelativePath), '.\\/').'/variants';
        $baseName = pathinfo($sourceRelativePath, PATHINFO_FILENAME);
        $variantRelativePath = $relativeDir.'/'.$baseName.'_'.$targetHeight.'.'.$extension;

        Storage::disk('public')->makeDirectory($relativeDir);
        $variantAbsolutePath = Storage::disk('public')->path($variantRelativePath);
        $saved = match ($mimeType) {
            'image/jpeg' => @imagejpeg(
                $targetImage,
                $variantAbsolutePath,
                max(1, min(100, (int) ($options['jpeg_quality'] ?? 90))),
            ),
            'image/png' => @imagepng(
                $targetImage,
                $variantAbsolutePath,
                max(0, min(9, (int) ($options['png_compression'] ?? 6))),
            ),
            'image/webp' => function_exists('imagewebp')
                ? @imagewebp(
                    $targetImage,
                    $variantAbsolutePath,
                    max(1, min(100, (int) ($options['webp_quality'] ?? 88))),
                )
                : false,
            default => false,
        };

        imagedestroy($targetImage);
        imagedestroy($sourceImage);

        if (!$saved) {
            return null;
        }

        $variantSizeKb = max(1, (int) round((@filesize($variantAbsolutePath) ?: 0) / 1024));

        return [
            'url' => Storage::url($variantRelativePath),
            'size_kb' => $variantSizeKb,
        ];
    }

    /**
     * @return list<int>
     */
    private function resolveTags(string $rawTags): array
    {
        $names = collect(explode(',', $rawTags))
            ->map(fn ($tag) => trim((string) $tag))
            ->filter()
            ->unique()
            ->take(12)
            ->values();

        if ($names->isEmpty()) {
            return [];
        }

        $tagIds = [];
        foreach ($names as $name) {
            $tag = Tag::query()->firstOrCreate(['name' => $name]);
            $tagIds[] = (int) $tag->id;
        }

        return $tagIds;
    }

    private function generateNextWallpaperCode(): string
    {
        $maxNumeric = (int) (Wallpaper::withTrashed()
            ->whereRaw("code REGEXP '^[0-9]+$'")
            ->selectRaw('MAX(CAST(code AS UNSIGNED)) as max_code')
            ->value('max_code') ?? 0);

        $next = $maxNumeric + 1;

        return str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @param array<int,int> $standards
     */
    private function resolveClosestStandardQuality(int $height, array $standards): int
    {
        if ($height <= 0 || empty($standards)) {
            return 1080;
        }

        $closest = $standards[0];
        $smallestDiff = abs($height - $closest);

        foreach ($standards as $value) {
            $diff = abs($height - $value);
            if ($diff < $smallestDiff) {
                $closest = $value;
                $smallestDiff = $diff;
                continue;
            }

            // Tie-breaker: choose higher quality when equally close.
            if ($diff === $smallestDiff && $value > $closest) {
                $closest = $value;
            }
        }

        return $closest;
    }
}
