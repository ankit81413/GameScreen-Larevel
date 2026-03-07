<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserInterest extends Model
{
    protected $fillable = [
        'user_id',
        'tag_id',
        'round_number',
    ];

    public function tag()
    {
        return $this->belongsTo(Tag::class);
    }
}
