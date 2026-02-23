<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\Wallpaper;

class ViewPageController extends Controller
{
    // public function view($id){
    //     return $id;
    // }

    public function view($code){

        $wallpaper = Wallpaper::where('code',$code)->with(['links','tags'])->first();
        // return $wallpaper;

        return Inertia::render('view',[
            'canRegister'=>Features::enabled(Features::registration()),
            'wallpapers' => $wallpaper,
              
        ]);
    }
}
