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
        Schema::create('finance_wallet_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('collaborator_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['collaborator'])->default('collaborator');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(
                ['owner_user_id', 'collaborator_user_id'],
                'finance_wallet_collab_owner_collab_unique'
            );
            $table->index(
                ['owner_user_id', 'collaborator_user_id'],
                'finance_wallet_collab_owner_collab_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_wallet_collaborators');
    }
};
