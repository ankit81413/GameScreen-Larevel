<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_wallpaper_interactions')) {
            return;
        }

        Schema::create('user_wallpaper_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallpaper_id')->constrained('wallpapers')->cascadeOnDelete();
            $table->unsignedInteger('view_count')->default(0);
            $table->boolean('liked')->default(false);
            $table->unsignedInteger('comment_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'wallpaper_id']);
            $table->index(['user_id', 'liked']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_wallpaper_interactions');
    }
};
