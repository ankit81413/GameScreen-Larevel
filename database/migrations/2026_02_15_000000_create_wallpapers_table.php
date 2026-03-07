<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('wallpapers')) {
            return;
        }

        Schema::create('wallpapers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->nullable()->unique();
            $table->string('name');
            $table->text('thumbnail');
            $table->text('quality_thumbnail')->nullable();
            $table->unsignedTinyInteger('type');
            $table->string('orientation', 10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallpapers');
    }
};

