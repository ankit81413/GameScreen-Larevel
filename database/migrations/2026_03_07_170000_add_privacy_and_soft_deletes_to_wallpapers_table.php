<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('wallpapers')) {
            return;
        }

        Schema::table('wallpapers', function (Blueprint $table) {
            if (!Schema::hasColumn('wallpapers', 'is_private')) {
                $table->boolean('is_private')->default(false)->after('owner_id');
            }

            if (!Schema::hasColumn('wallpapers', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('wallpapers')) {
            return;
        }

        Schema::table('wallpapers', function (Blueprint $table) {
            if (Schema::hasColumn('wallpapers', 'is_private')) {
                $table->dropColumn('is_private');
            }

            if (Schema::hasColumn('wallpapers', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
