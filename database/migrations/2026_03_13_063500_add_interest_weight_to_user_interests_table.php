<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('user_interests')) {
            return;
        }

        Schema::table('user_interests', function (Blueprint $table) {
            if (!Schema::hasColumn('user_interests', 'interest_weight')) {
                $table->unsignedInteger('interest_weight')->default(8)->after('round_number');
            }
        });

        DB::table('user_interests')->update([
            'interest_weight' => DB::raw("
                CASE
                    WHEN round_number = 1 THEN 12
                    WHEN round_number = 2 THEN 10
                    ELSE 8
                END
            "),
        ]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('user_interests')) {
            return;
        }

        Schema::table('user_interests', function (Blueprint $table) {
            if (Schema::hasColumn('user_interests', 'interest_weight')) {
                $table->dropColumn('interest_weight');
            }
        });
    }
};
