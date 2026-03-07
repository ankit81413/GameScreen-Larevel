<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WallpaperLink extends Model
{
    protected $table = 'wallpaper_links';
    protected $fillable = [
        'wallpaper_id',
        'quality',
        'size',
        'url',
    ];

    public function wallpaper()
    {
        return $this->belongsTo(Wallpaper::class);
    }
}
