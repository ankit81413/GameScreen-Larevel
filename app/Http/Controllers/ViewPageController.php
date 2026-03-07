<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\SavedWallpaper;
use App\Models\Wallpaper;

class ViewPageController extends Controller
{
    // public function view($id){
    //     return $id;
    // }

    public function view(Request $request, $code){

        $wallpaper = Wallpaper::where('code',$code)->with(['links','tags'])->firstOrFail();
        $isSaved = false;
        if ($request->user()) {
            $isSaved = SavedWallpaper::query()
                ->where('user_id', $request->user()->id)
                ->where('wallpaper_id', $wallpaper->id)
                ->exists();
        }
        $wallpaper->setAttribute('is_saved', $isSaved);

        return Inertia::render('view',[
            'canRegister'=>Features::enabled(Features::registration()),
            'wallpaper' => $wallpaper,
              
        ]);
    }
}
