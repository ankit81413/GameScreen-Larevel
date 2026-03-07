<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;

class TagSuggestionController extends Controller
{
    public function index(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        if ($query === '') {
            return response()->json([]);
        }

        $items = Tag::query()
            ->whereRaw('LOWER(name) LIKE ?', [mb_strtolower($query).'%'])
            ->orWhereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($query).'%'])
            ->orderByRaw('CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END', [mb_strtolower($query).'%'])
            ->limit(10)
            ->pluck('name')
            ->values();

        return response()->json($items);
    }
}
