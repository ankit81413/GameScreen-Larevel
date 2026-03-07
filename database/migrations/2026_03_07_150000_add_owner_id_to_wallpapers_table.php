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
        if (!Schema::hasTable('wallpapers')) {
            return;
        }

        Schema::table('wallpapers', function (Blueprint $table) {
            if (!Schema::hasColumn('wallpapers', 'owner_id')) {
                $table->unsignedBigInteger('owner_id')->nullable()->after('id');
                $table->index('owner_id');
                $table->foreign('owner_id')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('wallpapers')) {
            return;
        }

        Schema::table('wallpapers', function (Blueprint $table) {
            if (Schema::hasColumn('wallpapers', 'owner_id')) {
                $table->dropForeign(['owner_id']);
                $table->dropIndex(['owner_id']);
                $table->dropColumn('owner_id');
            }
        });
    }
};
