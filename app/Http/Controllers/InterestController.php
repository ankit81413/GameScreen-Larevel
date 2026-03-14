<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\UserInterest;
use App\Models\UserWallpaperInteraction;
use App\Models\Wallpaper;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class InterestController extends Controller
{
    public function show(Request $request)
    {
        $existingTagIds = UserInterest::query()
            ->where('user_id', $request->user()->id)
            ->pluck('tag_id');

        $allTags = Tag::query()
            ->when(
                $existingTagIds->isNotEmpty(),
                fn ($query) => $query->whereNotIn('id', $existingTagIds),
            )
            ->get(['id', 'name']);
        $roundCount = 3;
        $minimumRoundSize = 3;
        $maxDisjointPerRound = intdiv(max($allTags->count(), 0), $roundCount);
        $roundSize = min(12, max($minimumRoundSize, $maxDisjointPerRound));

        $shuffled = $allTags->shuffle()->values();
        $canBuildDisjointRounds = $allTags->count() >= ($roundSize * $roundCount);

        $rounds = collect(range(0, $roundCount - 1))
            ->map(function ($roundIndex) use ($allTags, $shuffled, $roundSize, $canBuildDisjointRounds) {
                $source = $canBuildDisjointRounds
                    ? $shuffled->slice($roundIndex * $roundSize, $roundSize)->values()
                    : $allTags->shuffle()->take($roundSize)->values();

                return $source->map(fn ($tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'thumbnail' => $tag->wallpapers()
                        ->inRandomOrder()
                        ->value('thumbnail'),
                ]);
            })
            ->values();

        return Inertia::render('onboarding/interests', [
            'rounds' => $rounds,
            'existing_interest_count' => $existingTagIds->count(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rounds' => ['required', 'array', 'size:3'],
            'rounds.*' => ['required', 'array', 'size:3'],
            'rounds.*.*' => ['required', 'integer', 'exists:tags,id'],
        ]);

        $flatTagIds = collect($validated['rounds'])->flatten();
        $user = $request->user();
        $existingTagIds = UserInterest::query()
            ->where('user_id', $user->id)
            ->pluck('tag_id');
        $totalTags = Tag::query()->count();
        $requiredUniqueCount = min(9, $totalTags);

        if ($requiredUniqueCount > 0 && $flatTagIds->unique()->count() < $requiredUniqueCount) {
            return response()->json([
                'message' => 'Please select unique tags across all rounds.',
            ], 422);
        }

        if ($existingTagIds->intersect($flatTagIds)->isNotEmpty()) {
            return response()->json([
                'message' => 'Please choose new tags that are not already in your interests.',
            ], 422);
        }

        foreach ($validated['rounds'] as $roundIndex => $tagIds) {
            foreach ($tagIds as $tagId) {
                UserInterest::query()->firstOrCreate([
                    'user_id' => $user->id,
                    'tag_id' => $tagId,
                ], [
                    'round_number' => $roundIndex + 1,
                    'interest_weight' => $this->weightForRound($roundIndex + 1),
                ]);
            }
        }

        return response()->json(['ok' => true]);
    }

    public function myInterests(Request $request)
    {
        $user = $request->user();

        $items = UserInterest::query()
            ->where('user_id', $user->id)
            ->with('tag')
            ->latest('interest_weight')
            ->latest('id')
            ->get()
            ->map(function ($item) {
                $tag = $item->tag;
                if (!$tag) {
                    return null;
                }

                return [
                    'id' => $item->id,
                    'round_number' => $item->round_number,
                    'interest_weight' => (int) $item->interest_weight,
                    'tag_id' => $tag->id,
                    'name' => $tag->name,
                    'thumbnail' => $tag->wallpapers()
                        ->inRandomOrder()
                        ->value('thumbnail'),
                ];
            })
            ->filter()
            ->values();

        return response()->json($items);
    }

    public function destroy(Request $request, UserInterest $interest)
    {
        $user = $request->user();
        if ((int) $interest->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $interest->delete();

        return response()->json(['ok' => true]);
    }

    public function weightsForUser(int $userId): Collection
    {
        return UserInterest::query()
            ->where('user_id', $userId)
            ->orderByDesc('interest_weight')
            ->get(['tag_id', 'interest_weight'])
            ->mapWithKeys(fn ($interest) => [
                (int) $interest->tag_id => (int) $interest->interest_weight,
            ]);
    }

    public function weightForRound(int $roundNumber): int
    {
        return match ($roundNumber) {
            1 => 12,
            2 => 10,
            default => 8,
        };
    }

    public function recordWallpaperView(int $userId, Wallpaper $wallpaper): void
    {
        $interaction = UserWallpaperInteraction::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'wallpaper_id' => $wallpaper->id,
            ],
            [
                'view_count' => 0,
                'liked' => false,
                'comment_count' => 0,
            ],
        );

        $previousViewCount = (int) $interaction->view_count;
        $interaction->increment('view_count');

        if ($previousViewCount === 0) {
            $this->applyWallpaperInterestDelta($userId, $wallpaper, 2);
            return;
        }

        if (!$interaction->liked && (int) $interaction->comment_count === 0 && (($previousViewCount + 1) % 3) === 0) {
            $this->applyWallpaperInterestDelta($userId, $wallpaper, -1);
        }
    }

    public function recordWallpaperLike(int $userId, Wallpaper $wallpaper, bool $liked): void
    {
        $interaction = UserWallpaperInteraction::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'wallpaper_id' => $wallpaper->id,
            ],
            [
                'view_count' => 0,
                'liked' => false,
                'comment_count' => 0,
            ],
        );

        if ($liked) {
            if (!$interaction->liked) {
                $interaction->forceFill(['liked' => true])->save();
                $this->applyWallpaperInterestDelta($userId, $wallpaper, 8);
            }
            return;
        }

        if ($interaction->liked) {
            $interaction->forceFill(['liked' => false])->save();
            $this->applyWallpaperInterestDelta($userId, $wallpaper, -5);
        }
    }

    public function recordWallpaperComment(int $userId, Wallpaper $wallpaper): void
    {
        $interaction = UserWallpaperInteraction::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'wallpaper_id' => $wallpaper->id,
            ],
            [
                'view_count' => 0,
                'liked' => false,
                'comment_count' => 0,
            ],
        );

        $interaction->increment('comment_count');
        $this->applyWallpaperInterestDelta($userId, $wallpaper, 10);
    }

    public function removeWallpaperCommentInterest(int $userId, Wallpaper $wallpaper): void
    {
        $interaction = UserWallpaperInteraction::query()
            ->where('user_id', $userId)
            ->where('wallpaper_id', $wallpaper->id)
            ->first();

        if ($interaction && (int) $interaction->comment_count > 0) {
            $interaction->decrement('comment_count');
        }

        $this->applyWallpaperInterestDelta($userId, $wallpaper, -6);
    }

    private function applyWallpaperInterestDelta(int $userId, Wallpaper $wallpaper, int $delta): void
    {
        if ($delta === 0) {
            return;
        }

        $wallpaper->loadMissing('tags:id');

        foreach ($wallpaper->tags as $tag) {
            $interest = UserInterest::query()->firstOrNew([
                'user_id' => $userId,
                'tag_id' => $tag->id,
            ]);

            if (!$interest->exists && $delta < 0) {
                continue;
            }

            $currentWeight = (int) ($interest->interest_weight ?? 0);
            $interest->round_number = $interest->round_number ?? 3;
            $interest->interest_weight = max(0, $currentWeight + $delta);
            $interest->save();
        }
    }
}
