<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\BannerWallpaperController;
use App\Http\Controllers\SimilarWallpaperController;
use App\Http\Controllers\ViewPageController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\SearchHistoryController;
use App\Http\Controllers\SearchSuggestionController;
use App\Http\Controllers\AutoSearchController;

// Route::get('/', function () {
//     return Inertia::render('home', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');


Route::get('/', [HomeController::class,'index'])->name('home');
Route::get('/wallpapers', [HomeController::class, 'Loadmore'])->name('wallpapers.paginate');
Route::get('/banner-wallpapers', [BannerWallpaperController::class, 'index'])->name('banner.wallpapers');
Route::get('/similar-wallpapers', [SimilarWallpaperController::class, 'index'])->name('similar.wallpapers');
Route::get('/search-history', [SearchHistoryController::class, 'index'])->name('search.history.index');
Route::post('/search-history', [SearchHistoryController::class, 'store'])->name('search.history.store');
Route::get('/search-suggestions', [SearchSuggestionController::class, 'index'])->name('search.suggestions');
Route::get('/auto-search', [AutoSearchController::class, 'index'])->name('auto-search');
Route::get('/auto-search/wallpapers', [AutoSearchController::class, 'loadmore'])->name('auto-search.paginate');
Route::get('/download/{code}', [DownloadController::class, 'download'])->name('download');
Route::get('/view/{code}',[ViewPageController::class,'view'])->name('viewWallpaper');
Route::get('/account', function () {
    return Inertia::render('account');
})->middleware(['auth'])->name('account');

// Route::get('/import-wallpapers', [ImportController::class, 'import']);
// Route::get('/viewall', [ImportController::class, 'view']);


Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__ . '/settings.php';
