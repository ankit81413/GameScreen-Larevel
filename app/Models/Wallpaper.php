<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wallpaper extends Model
{
    protected $table = 'wallpapers';

    protected $fillable = [
        'code',
        'name',
        'thumbnail',
        'quality_thumbnail',
        'type',
        'orientation',
    ];

    public function links()
    {
        return $this->hasMany(WallpaperLink::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'wallpaper_tag');
    }
}
