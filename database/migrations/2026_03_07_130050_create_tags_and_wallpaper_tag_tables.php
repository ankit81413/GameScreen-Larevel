<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tags')) {
            Schema::create('tags', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
            });
        }

        if (!Schema::hasTable('wallpaper_tag')) {
            Schema::create('wallpaper_tag', function (Blueprint $table) {
                $table->id();
                $table->foreignId('wallpaper_id')->constrained('wallpapers')->cascadeOnDelete();
                $table->foreignId('tag_id')->constrained('tags')->cascadeOnDelete();
                $table->unique(['wallpaper_id', 'tag_id']);
                $table->index(['tag_id', 'wallpaper_id']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('wallpaper_tag')) {
            Schema::dropIfExists('wallpaper_tag');
        }

        if (Schema::hasTable('tags')) {
            Schema::dropIfExists('tags');
        }
    }
};

