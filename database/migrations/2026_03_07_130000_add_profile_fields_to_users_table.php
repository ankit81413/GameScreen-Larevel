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
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('email');
            $table->date('birthdate')->nullable()->after('password');
            $table->boolean('age_confirmed')->default(false)->after('birthdate');
            $table->string('gender', 32)->nullable()->after('age_confirmed');
            $table->text('bio')->nullable()->after('gender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn(['username', 'birthdate', 'age_confirmed', 'gender', 'bio']);
        });
    }
};
