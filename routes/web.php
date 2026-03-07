<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\BannerWallpaperController;
use App\Http\Controllers\AccountSettingsController;
use App\Http\Controllers\UploadWallpaperController;
use App\Http\Controllers\SimilarWallpaperController;
use App\Http\Controllers\ViewPageController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\OnboardingInterestController;
use App\Http\Controllers\OnboardingProfileController;
use App\Http\Controllers\SearchHistoryController;
use App\Http\Controllers\SearchSuggestionController;
use App\Http\Controllers\AutoSearchController;
use App\Http\Controllers\SavedWallpaperController;
use App\Http\Controllers\TagSuggestionController;
use App\Http\Controllers\WallpaperInteractionController;
use App\Http\Controllers\WallpaperManageController;

// Route::get('/', function () {
//     return Inertia::render('home', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');


Route::get('/', [HomeController::class,'index'])->name('home');
Route::get('/wallpapers', [HomeController::class, 'Loadmore'])->name('wallpapers.paginate');
Route::get('/banner-wallpapers', [BannerWallpaperController::class, 'index'])->name('banner.wallpapers');
Route::get('/similar-wallpapers', [SimilarWallpaperController::class, 'index'])->name('similar.wallpapers');
Route::middleware('auth')->group(function () {
    Route::get('/search-history', [SearchHistoryController::class, 'index'])->name('search.history.index');
    Route::post('/search-history', [SearchHistoryController::class, 'store'])->name('search.history.store');
    Route::get('/saved-wallpapers', [SavedWallpaperController::class, 'index'])->name('saved.wallpapers.index');
    Route::post('/saved-wallpapers/toggle', [SavedWallpaperController::class, 'toggle'])->name('saved.wallpapers.toggle');
    Route::get('/my-wallpapers', [UploadWallpaperController::class, 'mine'])->name('upload.mine');
    Route::get('/onboarding/profile', [OnboardingProfileController::class, 'show'])->name('onboarding.profile.show');
    Route::post('/onboarding/profile', [OnboardingProfileController::class, 'store'])->name('onboarding.profile.store');
    Route::get('/onboarding/interests', [OnboardingInterestController::class, 'show'])->name('onboarding.interests.show');
    Route::post('/onboarding/interests', [OnboardingInterestController::class, 'store'])->name('onboarding.interests.store');
    Route::get('/onboarding/my-interests', [OnboardingInterestController::class, 'myInterests'])->name('onboarding.interests.mine');
    Route::delete('/onboarding/my-interests/{interest}', [OnboardingInterestController::class, 'destroy'])->name('onboarding.interests.destroy');
});
Route::get('/search-suggestions', [SearchSuggestionController::class, 'index'])->name('search.suggestions');
Route::get('/tag-suggestions', [TagSuggestionController::class, 'index'])->name('tag.suggestions');
Route::get('/auto-search', [AutoSearchController::class, 'index'])->name('auto-search');
Route::get('/auto-search/wallpapers', [AutoSearchController::class, 'loadmore'])->name('auto-search.paginate');
Route::get('/download/{code}', [DownloadController::class, 'download'])->name('download');
Route::get('/view/{code}',[ViewPageController::class,'view'])->name('viewWallpaper');
Route::get('/account', function () {
    return Inertia::render('account');
})->middleware(['auth'])->name('account');
Route::middleware(['auth'])->group(function () {
    Route::get('/upload', [UploadWallpaperController::class, 'show'])->name('upload.show');
    Route::post('/upload', [UploadWallpaperController::class, 'store'])->name('upload.store');
    Route::get('/account/edit-profile', [AccountSettingsController::class, 'editProfile'])->name('account.profile.edit');
    Route::patch('/account/edit-profile', [AccountSettingsController::class, 'updateProfile'])->name('account.profile.update');
    Route::get('/account/change-password', [AccountSettingsController::class, 'editPassword'])->name('account.password.edit');
    Route::put('/account/change-password', [AccountSettingsController::class, 'updatePassword'])->name('account.password.update');
    Route::get('/account/delete-account', [AccountSettingsController::class, 'deleteAccount'])->name('account.delete.edit');
    Route::delete('/account/delete-account', [AccountSettingsController::class, 'destroy'])->name('account.delete.destroy');
    Route::get('/account/wallpapers/{wallpaper}/edit', [WallpaperManageController::class, 'edit'])->name('account.wallpapers.edit');
    Route::patch('/account/wallpapers/{wallpaper}', [WallpaperManageController::class, 'update'])->name('account.wallpapers.update');
    Route::patch('/account/wallpapers/{wallpaper}/privacy', [WallpaperManageController::class, 'togglePrivacy'])->name('account.wallpapers.privacy');
    Route::delete('/account/wallpapers/{wallpaper}', [WallpaperManageController::class, 'destroy'])->name('account.wallpapers.destroy');
    Route::post('/wallpapers/{wallpaper}/like', [WallpaperInteractionController::class, 'toggleLike'])->name('wallpapers.like');
    Route::post('/wallpapers/{wallpaper}/comments', [WallpaperInteractionController::class, 'storeComment'])->name('wallpapers.comments.store');
    Route::delete('/wallpaper-comments/{comment}', [WallpaperInteractionController::class, 'destroyComment'])->name('wallpapers.comments.destroy');
});

// Route::get('/import-wallpapers', [ImportController::class, 'import']);
// Route::get('/viewall', [ImportController::class, 'view']);


Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__ . '/settings.php';
