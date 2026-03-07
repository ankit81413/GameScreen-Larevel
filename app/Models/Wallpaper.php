<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Wallpaper extends Model
{
    use SoftDeletes;

    protected $table = 'wallpapers';

    protected $fillable = [
        'owner_id',
        'is_private',
        'code',
        'name',
        'thumbnail',
        'quality_thumbnail',
        'type',
        'orientation',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function links()
    {
        return $this->hasMany(WallpaperLink::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'wallpaper_tag');
    }
}
