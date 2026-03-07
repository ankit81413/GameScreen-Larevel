<?php

namespace App\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        return $request->wantsJson()
            ? new JsonResponse('', 201)
            : redirect('/onboarding/profile');
    }
}
