<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\UserInterest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OnboardingInterestController extends Controller
{
    public function show(Request $request)
    {
        $allTags = Tag::query()->get(['id', 'name']);
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
        $totalTags = Tag::query()->count();
        $requiredUniqueCount = min(9, $totalTags);

        if ($requiredUniqueCount > 0 && $flatTagIds->unique()->count() < $requiredUniqueCount) {
            return response()->json([
                'message' => 'Please select unique tags across all rounds.',
            ], 422);
        }

        $user = $request->user();
        UserInterest::query()->where('user_id', $user->id)->delete();

        foreach ($validated['rounds'] as $roundIndex => $tagIds) {
            foreach ($tagIds as $tagId) {
                UserInterest::query()->create([
                    'user_id' => $user->id,
                    'tag_id' => $tagId,
                    'round_number' => $roundIndex + 1,
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
}
