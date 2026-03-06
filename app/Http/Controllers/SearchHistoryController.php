<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use Illuminate\Http\Request;

class SearchHistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([]);
        }

        $items = SearchHistory::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(10)
            ->pluck('query');

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:120'],
        ]);

        $query = trim($validated['query']);
        if ($query === '') {
            return response()->json(['message' => 'Empty query'], 422);
        }

        SearchHistory::query()
            ->where('user_id', $user->id)
            ->where('query', $query)
            ->delete();

        SearchHistory::query()->create([
            'user_id' => $user->id,
            'query' => $query,
        ]);

        $overflowIds = SearchHistory::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->skip(10)
            ->pluck('id');

        if ($overflowIds->isNotEmpty()) {
            SearchHistory::query()->whereIn('id', $overflowIds)->delete();
        }

        return response()->json(['ok' => true]);
    }
}
