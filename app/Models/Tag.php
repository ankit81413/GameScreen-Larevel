<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $table = 'tags';

    public function wallpapers()
    {
        return $this->belongsToMany(Wallpaper::class, 'wallpaper_tag');
    }
}
