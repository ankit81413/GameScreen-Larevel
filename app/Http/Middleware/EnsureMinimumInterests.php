<?php

namespace App\Http\Middleware;

use App\Models\UserInterest;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMinimumInterests
{
    private const MINIMUM_INTERESTS = 5;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        if ($request->routeIs('onboarding.interests.*')) {
            return $next($request);
        }

        $interestCount = UserInterest::query()
            ->where('user_id', $user->id)
            ->count();

        if ($interestCount < self::MINIMUM_INTERESTS) {
            return redirect()->route('onboarding.interests.show');
        }

        return $next($request);
    }
}
