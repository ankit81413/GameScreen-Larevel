<?php

use App\Http\Controllers\ResolutionCallbackController;
use Illuminate\Support\Facades\Route;

Route::post('/internal/resolution-callback', [ResolutionCallbackController::class, 'store'])
    ->name('resolution.callback');

