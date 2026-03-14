<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserWallpaperInteraction extends Model
{
    protected $fillable = [
        'user_id',
        'wallpaper_id',
        'view_count',
        'liked',
        'comment_count',
    ];

    protected function casts(): array
    {
        return [
            'liked' => 'boolean',
        ];
    }
}
