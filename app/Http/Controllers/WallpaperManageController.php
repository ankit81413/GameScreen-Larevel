<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Wallpaper;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WallpaperManageController extends Controller
{
    public function edit(Request $request, Wallpaper $wallpaper): Response
    {
        $this->authorizeOwnership($request, $wallpaper);

        $wallpaper->load('tags:id,name');

        return Inertia::render('account/edit-wallpaper', [
            'wallpaper' => [
                'id' => $wallpaper->id,
                'code' => $wallpaper->code,
                'name' => $wallpaper->name,
                'type' => (string) $wallpaper->type,
                'orientation' => $wallpaper->orientation,
                'is_private' => (bool) $wallpaper->is_private,
                'tags' => $wallpaper->tags->pluck('name')->values(),
            ],
        ]);
    }

    public function update(Request $request, Wallpaper $wallpaper)
    {
        $this->authorizeOwnership($request, $wallpaper);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'integer', Rule::in([1, 2])],
            'orientation' => ['required', 'string', Rule::in(['land', 'port'])],
            'is_private' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'string', 'max:500'],
        ]);

        $wallpaper->update([
            'name' => $validated['name'],
            'type' => (int) $validated['type'],
            'orientation' => $validated['orientation'],
            'is_private' => (bool) ($validated['is_private'] ?? false),
        ]);

        $tagIds = $this->resolveTags((string) ($validated['tags'] ?? ''));
        $wallpaper->tags()->sync($tagIds);

        return redirect('/account');
    }

    public function togglePrivacy(Request $request, Wallpaper $wallpaper)
    {
        $this->authorizeOwnership($request, $wallpaper);

        $validated = $request->validate([
            'is_private' => ['required', 'boolean'],
        ]);

        $wallpaper->update([
            'is_private' => (bool) $validated['is_private'],
        ]);

        return response()->json([
            'ok' => true,
            'is_private' => (bool) $wallpaper->is_private,
        ]);
    }

    public function destroy(Request $request, Wallpaper $wallpaper)
    {
        $this->authorizeOwnership($request, $wallpaper);
        $wallpaper->delete();

        return response()->json(['ok' => true]);
    }

    public function restore(Request $request, int $wallpaper)
    {
        $item = Wallpaper::onlyTrashed()
            ->where('id', $wallpaper)
            ->firstOrFail();

        abort_unless((int) $item->owner_id === (int) $request->user()->id, 403);

        $item->restore();
        $item->load(['links' => function ($query) {
            $query->select(['id', 'wallpaper_id', 'quality', 'url']);
        }]);

        return response()->json([
            'ok' => true,
            'wallpaper' => [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'thumbnail' => $item->thumbnail,
                'type' => $item->type,
                'orientation' => $item->orientation,
                'is_private' => (bool) $item->is_private,
                'links' => $item->links,
            ],
        ]);
    }

    private function authorizeOwnership(Request $request, Wallpaper $wallpaper): void
    {
        abort_unless((int) $wallpaper->owner_id === (int) $request->user()->id, 403);
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
}
