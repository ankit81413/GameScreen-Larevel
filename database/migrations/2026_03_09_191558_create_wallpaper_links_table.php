<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wallpaper_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wallpaper_id');
            $table->string('quality', 20);
            $table->string('size', 20);
            $table->text('url');
            $table->timestamps();

            $table->foreign('wallpaper_id')
              ->references('id')
              ->on('wallpapers')
              ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallpaper_links');
    }
};
