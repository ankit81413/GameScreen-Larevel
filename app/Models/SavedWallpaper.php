<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedWallpaper extends Model
{
    protected $fillable = [
        'user_id',
        'wallpaper_id',
        'wallpaper_code',
        'wallpaper_name',
        'wallpaper_thumbnail',
        'wallpaper_type',
    ];

    public function wallpaper()
    {
        return $this->belongsTo(Wallpaper::class);
    }
}
