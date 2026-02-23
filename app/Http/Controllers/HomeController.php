<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use inertia\Inertia;
use Laravel\Fortify\Features;
use App\Models\Wallpaper;

class HomeController extends Controller
{
    public function index(){

        $wallpapers = Wallpaper::with(['links','tags'])->paginate(10);
        $wallpapers->withPath(route('wallpapers.paginate'));
        

        return Inertia::render('home',[
            'canRegister'=>Features::enabled(Features::registration()),
            'wallpapers' => $wallpapers,
              
        ]);
    }

    public function Loadmore(Request $request)
    {
        $wallpapers = Wallpaper::with(['links', 'tags'])->paginate(10);
        $wallpapers->withPath(route('wallpapers.paginate'));

        return response()->json($wallpapers);
    }
}
