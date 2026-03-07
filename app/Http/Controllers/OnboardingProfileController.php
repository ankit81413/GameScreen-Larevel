<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OnboardingProfileController extends Controller
{
    public function show()
    {
        return Inertia::render('onboarding/profile');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'birthdate' => ['nullable', 'date', 'before:today'],
            'age_confirmed' => ['nullable', 'boolean'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'non_binary', 'prefer_not_to_say'])],
            'bio' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $user->update([
            'birthdate' => $validated['birthdate'] ?? null,
            'age_confirmed' => (bool) ($validated['age_confirmed'] ?? false),
            'gender' => $validated['gender'] ?? null,
            'bio' => $validated['bio'] ?? null,
        ]);

        return response()->json(['ok' => true]);
    }
}
