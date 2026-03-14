<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SimilarWallpaperController extends Controller
{
    private const PER_PAGE = 12;

    private const SIMILAR_PORTION = 6;

    private const INTEREST_PORTION = 4;

    private const DISCOVER_PORTION = 2;

    public function index(Request $request)
    {
        $wallpaperCode = trim((string) $request->query('wallpaper_code', ''));
        $page = max((int) $request->query('page', 1), 1);
        $seed = $this->resolveSeed($request);

        if ($wallpaperCode === '') {
            return response()->json([
                'data' => [],
                'next_page_url' => null,
            ]);
        }

        $currentWallpaper = Wallpaper::query()
            ->with('tags:id')
            ->where('code', $wallpaperCode)
            ->first();

        if (!$currentWallpaper) {
            return response()->json([
                'data' => [],
                'next_page_url' => null,
            ]);
        }

        $baseQuery = Wallpaper::query()
            ->whereKeyNot($currentWallpaper->id)
            ->where('is_private', false)
            ->whereHas('links')
            ->with(['links', 'tags']);

        $similarityIds = $this->buildSimilarityQuery(
            clone $baseQuery,
            $currentWallpaper,
            $seed,
        )->pluck('wallpapers.id');

        $interestIds = collect();
        if ($request->user()) {
            $interestIds = $this->buildInterestQuery(
                clone $baseQuery,
                (int) $request->user()->id,
                $seed,
            )->pluck('wallpapers.id');
        }

        $discoverableIds = $this->applySeededShuffle(clone $baseQuery, $seed)
            ->pluck('wallpapers.id');

        $orderedIds = $this->mergeRecommendationBuckets(
            $similarityIds,
            $interestIds,
            $discoverableIds,
        );

        $offset = ($page - 1) * self::PER_PAGE;
        $pageIds = $orderedIds->slice($offset, self::PER_PAGE)->values();

        if ($pageIds->isEmpty()) {
            return response()->json([
                'data' => [],
                'next_page_url' => null,
            ]);
        }

        $wallpapersById = Wallpaper::with(['links', 'tags'])
            ->whereIn('id', $pageIds->all())
            ->get()
            ->keyBy('id');

        $orderedWallpapers = $pageIds
            ->map(fn ($id) => $wallpapersById->get($id))
            ->filter()
            ->values();

        $hasMore = $orderedIds->count() > ($offset + self::PER_PAGE);
        $nextPageUrl = $hasMore
            ? route('similar.wallpapers', [
                'page' => $page + 1,
                'wallpaper_code' => $wallpaperCode,
                'seed' => $seed,
            ])
            : null;

        return response()->json([
            'data' => $orderedWallpapers,
            'next_page_url' => $nextPageUrl,
        ]);
    }

    private function buildSimilarityQuery($query, Wallpaper $currentWallpaper, string $seed)
    {
        $tagIds = $currentWallpaper->tags->pluck('id')->all();
        $nameTokens = $this->extractNameTokens($currentWallpaper->name);
        $bindings = [];
        $scoreParts = [];

        if (!empty($tagIds)) {
            $scoreParts[] = '(
                SELECT COUNT(*)
                FROM wallpaper_tag
                WHERE wallpaper_tag.wallpaper_id = wallpapers.id
                  AND wallpaper_tag.tag_id IN ('.implode(',', array_fill(0, count($tagIds), '?')).')
            ) * 12';
            $bindings = [...$bindings, ...$tagIds];
        }

        if (!empty($nameTokens)) {
            $nameCases = [];
            foreach ($nameTokens as $token) {
                $nameCases[] = 'CASE WHEN LOWER(wallpapers.name) LIKE ? THEN 4 ELSE 0 END';
                $bindings[] = '%'.$token.'%';
            }
            $scoreParts[] = '('.implode(' + ', $nameCases).')';
        }

        if (empty($scoreParts)) {
            return $this->applySeededShuffle($query, $seed);
        }

        return $query
            ->orderByRaw('('.implode(' + ', $scoreParts).') DESC', $bindings)
            ->orderByRaw("SHA2(CONCAT(?, '-', wallpapers.id), 256)", [$seed]);
    }

    private function buildInterestQuery($query, int $userId, string $seed)
    {
        $weights = app(InterestController::class)->weightsForUser($userId);
        if ($weights->isEmpty()) {
            return $this->applySeededShuffle($query, $seed);
        }

        $interestTagIds = $weights->keys()->all();
        $weightCases = [];
        $bindings = [];
        foreach ($weights as $tagId => $weight) {
            $weightCases[] = 'WHEN wallpaper_tag.tag_id = ? THEN ?';
            $bindings[] = (int) $tagId;
            $bindings[] = (int) $weight;
        }

        $tagPlaceholders = implode(',', array_fill(0, count($interestTagIds), '?'));

        return $query
            ->whereHas('tags', function ($builder) use ($interestTagIds) {
                $builder->whereIn('tags.id', $interestTagIds);
            })
            ->orderByRaw(
                "(
                    SELECT COALESCE(SUM(
                        CASE
                            ".implode(' ', $weightCases)."
                            ELSE 0
                        END
                    ), 0)
                    FROM wallpaper_tag
                    WHERE wallpaper_tag.wallpaper_id = wallpapers.id
                      AND wallpaper_tag.tag_id IN ({$tagPlaceholders})
                ) DESC",
                [...$bindings, ...$interestTagIds],
            )
            ->orderByRaw("SHA2(CONCAT(?, '-', wallpapers.id), 256)", [$seed]);
    }

    private function applySeededShuffle($query, string $seed)
    {
        return $query->orderByRaw(
            "SHA2(CONCAT(?, '-', wallpapers.id), 256)",
            [$seed],
        );
    }

    private function mergeRecommendationBuckets(
        Collection $similarityIds,
        Collection $interestIds,
        Collection $discoverableIds,
    ): Collection {
        $seen = [];
        $ordered = collect();
        $buckets = [
            ['ids' => $similarityIds->values()->all(), 'take' => self::SIMILAR_PORTION],
            ['ids' => $interestIds->values()->all(), 'take' => self::INTEREST_PORTION],
            ['ids' => $discoverableIds->values()->all(), 'take' => self::DISCOVER_PORTION],
        ];

        while ($this->hasRemainingIds($buckets)) {
            foreach ($buckets as $index => $bucket) {
                $taken = 0;
                while ($taken < $bucket['take'] && !empty($buckets[$index]['ids'])) {
                    $candidateId = array_shift($buckets[$index]['ids']);
                    if (isset($seen[$candidateId])) {
                        continue;
                    }

                    $seen[$candidateId] = true;
                    $ordered->push($candidateId);
                    $taken++;
                }
            }
        }

        return $ordered;
    }

    private function hasRemainingIds(array $buckets): bool
    {
        foreach ($buckets as $bucket) {
            if (!empty($bucket['ids'])) {
                return true;
            }
        }

        return false;
    }

    private function extractNameTokens(string $name): array
    {
        return collect(preg_split('/[^a-z0-9]+/i', mb_strtolower($name)))
            ->filter(fn ($token) => is_string($token) && mb_strlen($token) >= 3)
            ->unique()
            ->values()
            ->all();
    }

    private function resolveSeed(Request $request): string
    {
        $seed = trim((string) $request->query('seed', ''));
        if ($seed !== '') {
            return $seed;
        }

        return (string) str()->uuid();
    }
}
