<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WallpaperLike extends Model
{
    protected $fillable = [
        'user_id',
        'wallpaper_id',
    ];
}

