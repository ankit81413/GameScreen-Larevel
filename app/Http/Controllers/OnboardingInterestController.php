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
        $roundSize = min(12, max(3, $allTags->count()));

        $rounds = collect(range(1, 3))
            ->map(function () use ($allTags, $roundSize) {
                return $allTags
                    ->shuffle()
                    ->take($roundSize)
                    ->values()
                    ->map(fn ($tag) => [
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
        if ($flatTagIds->unique()->count() !== 9) {
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
}
