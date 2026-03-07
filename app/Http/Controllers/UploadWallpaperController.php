<?php

namespace App\Http\Controllers;

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
            ->latest('id')
            ->limit(60)
            ->get(['id', 'code', 'name', 'thumbnail', 'type', 'orientation', 'is_private']);

        return response()->json($items);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'integer', 'in:1,2'],
            'orientation' => ['required', 'string', 'in:land,port'],
            'tags' => ['nullable', 'string', 'max:500'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov', 'max:512000'],
            'thumbnail' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:51200'],
        ]);

        $user = $request->user();

        DB::beginTransaction();
        try {
            $code = $this->generateNextWallpaperCode();

            $file = $validated['file'];
            $filePath = $file->store('wallpapers/uploads', 'public');
            $fileUrl = Storage::url($filePath);
            $fileSizeKb = max(1, (int) round($file->getSize() / 1024));

            $thumbnailUrl = $fileUrl;
            if (!empty($validated['thumbnail'])) {
                $thumbPath = $validated['thumbnail']->store('wallpapers/uploads/thumbnails', 'public');
                $thumbnailUrl = Storage::url($thumbPath);
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
                        'quality_thumbnail' => $thumbnailUrl,
                        'type' => (int) $validated['type'],
                        'orientation' => $validated['orientation'],
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

            $this->createLinksFromUploadedFile(
                wallpaper: $wallpaper,
                storedRelativePath: $filePath,
                fileUrl: $fileUrl,
                fileSizeKb: $fileSizeKb,
                mimeType: (string) $file->getMimeType(),
            );

            $tagIds = $this->resolveTags($validated['tags'] ?? '');
            if (!empty($tagIds)) {
                $wallpaper->tags()->sync($tagIds);
            }

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
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

        $baseQuality = collect($standards)
            ->first(fn ($value) => $height >= $value);
        if (!$baseQuality) {
            $baseQuality = (int) $height;
        }

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

        $baseQuality = collect($standards)->first(fn ($value) => $height >= $value);
        if (!$baseQuality) {
            $baseQuality = (int) $height;
        }

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
    ): ?array {
        [$srcWidth, $srcHeight] = $this->safeImageSize($sourcePath);
        if ($srcWidth < 1 || $srcHeight < 1 || $targetHeight <= 0 || $targetHeight >= $srcHeight) {
            return null;
        }

        $sourceImage = match ($mimeType) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => function_exists('imagecreatefromwebp')
                ? @imagecreatefromwebp($sourcePath)
                : false,
            default => false,
        };

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
            'image/jpeg' => @imagejpeg($targetImage, $variantAbsolutePath, 90),
            'image/png' => @imagepng($targetImage, $variantAbsolutePath, 6),
            'image/webp' => function_exists('imagewebp')
                ? @imagewebp($targetImage, $variantAbsolutePath, 88)
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
}
