<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('finance_transactions', 'client_request_id')) {
                $table->string('client_request_id', 64)->nullable()->after('created_by_user_id');
                $table->unique(['user_id', 'client_request_id'], 'finance_transactions_client_request_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('finance_transactions', 'client_request_id')) {
                $table->dropUnique('finance_transactions_client_request_unique');
                $table->dropColumn('client_request_id');
            }
        });
    }
};
