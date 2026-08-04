<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->char('code', 2)->primary();
            $table->string('name');
            $table->char('currency', 3)->default('PHP');
            $table->string('default_locale')->default('en');
            $table->timestamps();
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->char('country_code', 2);
            $table->string('code', 16);
            $table->string('name');
            $table->timestamps();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
            $table->unique(['country_code', 'code']);
        });

        DB::table('countries')->insert([
            ['code' => 'PH', 'name' => 'Philippines', 'currency' => 'PHP', 'default_locale' => 'en-PH', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'US', 'name' => 'United States', 'currency' => 'USD', 'default_locale' => 'en-US', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->char('country_code', 2)->default('PH');
            $table->string('name');
            $table->string('timezone')->default('Asia/Manila');
            $table->char('currency', 3)->default('PHP');
            $table->boolean('meal_planning_enabled')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('country_code')->references('code')->on('countries');
        });

        Schema::create('household_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->enum('role', ['owner', 'admin', 'member'])->default('member');
            $table->enum('classification', ['adult', 'child']);
            $table->enum('sex_at_birth', ['female', 'male'])->nullable();
            $table->date('birth_date')->nullable();
            $table->decimal('height_cm', 6, 2)->nullable();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->enum('activity_level', ['sedentary', 'low_active', 'active', 'very_active'])->nullable();
            $table->enum('nutrition_goal', ['maintenance', 'gradual_loss', 'gradual_gain', 'custom'])->default('maintenance');
            $table->boolean('calorie_counting_enabled')->default(false);
            $table->json('nutrition_targets')->nullable();
            $table->enum('target_source', ['derived', 'manual', 'professional'])->nullable();
            $table->string('professional_source')->nullable();
            $table->json('allergies')->nullable();
            $table->json('dietary_restrictions')->nullable();
            $table->json('food_preferences')->nullable();
            $table->json('disliked_foods')->nullable();
            $table->json('participation_schedule')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['household_id', 'user_id']);
            $table->index(['household_id', 'classification']);
        });

        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('canonical_name');
            $table->string('category')->nullable()->index();
            $table->decimal('density_g_per_ml', 10, 4)->nullable();
            $table->json('allergens')->nullable();
            $table->json('dietary_tags')->nullable();
            $table->timestamps();
        });

        Schema::create('ingredient_aliases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->string('alias');
            $table->string('normalized_alias')->index();
            $table->string('locale', 16)->nullable();
            $table->enum('match_status', ['confirmed', 'suggested'])->default('confirmed');
            $table->timestamps();
            $table->unique(['normalized_alias', 'locale']);
        });

        Schema::create('ingredient_localizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->char('country_code', 2);
            $table->string('locale', 16);
            $table->string('display_name');
            $table->timestamps();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
            $table->unique(['ingredient_id', 'country_code', 'locale'], 'ingredient_localization_unique');
        });

        Schema::create('ingredient_nutrition', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('basis_quantity', 10, 3)->default(100);
            $table->string('basis_unit', 16)->default('g');
            $table->json('nutrients');
            $table->string('provider');
            $table->string('external_id')->nullable();
            $table->string('confidence', 16)->default('medium');
            $table->string('calculation_version')->default('ingredient-v1');
            $table->timestamp('retrieved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ingredient_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('external_id');
            $table->text('source_url')->nullable();
            $table->string('license')->nullable();
            $table->string('payload_checksum', 64);
            $table->enum('import_status', ['active', 'stale', 'failed'])->default('active');
            $table->timestamp('imported_at');
            $table->timestamp('last_synchronized_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'external_id']);
        });

        Schema::create('ingredient_substitutions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('substitute_ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->char('country_code', 2)->nullable();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->decimal('ratio', 8, 3)->default(1);
            $table->enum('ratio_unit', ['weight', 'volume', 'count'])->default('weight');
            $table->json('suitable_for')->nullable();
            $table->json('dietary_implications')->nullable();
            $table->json('nutrition_difference')->nullable();
            $table->text('flavor_difference')->nullable();
            $table->text('texture_difference')->nullable();
            $table->enum('confidence', ['low', 'medium', 'high'])->default('medium');
            $table->boolean('requires_confirmation')->default(false);
            $table->timestamps();
            $table->foreign('country_code')->references('code')->on('countries')->nullOnDelete();
        });

        Schema::create('country_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->char('country_code', 2);
            $table->foreignId('region_id')->nullable()->constrained('regions')->cascadeOnDelete();
            $table->enum('availability', ['common', 'available', 'specialty', 'seasonal', 'rare', 'unknown'])->default('unknown');
            $table->enum('affordability', ['low_cost', 'moderate', 'expensive', 'unknown'])->default('unknown');
            $table->json('season_months')->nullable();
            $table->json('likely_store_types')->nullable();
            $table->decimal('estimated_price_min', 12, 2)->nullable();
            $table->decimal('estimated_price_max', 12, 2)->nullable();
            $table->char('currency', 3)->nullable();
            $table->date('price_effective_on')->nullable();
            $table->string('data_source')->nullable();
            $table->enum('confidence', ['low', 'medium', 'high'])->default('medium');
            $table->timestamps();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
            $table->unique(['ingredient_id', 'country_code', 'region_id'], 'country_ingredient_unique');
        });

        Schema::create('regional_ingredient_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->char('country_code', 2);
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 16);
            $table->decimal('price', 12, 2);
            $table->char('currency', 3);
            $table->enum('confidence', ['low', 'medium', 'high'])->default('high');
            $table->string('source')->default('household');
            $table->date('effective_on');
            $table->timestamps();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
        });

        Schema::create('ingredient_package_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->char('country_code', 2);
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 16);
            $table->string('label')->nullable();
            $table->timestamps();
            $table->foreign('country_code')->references('code')->on('countries')->cascadeOnDelete();
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('scope', ['system', 'imported', 'household'])->default('imported');
            $table->string('name');
            $table->string('normalized_name')->index();
            $table->text('description')->nullable();
            $table->string('cuisine')->nullable()->index();
            $table->string('category')->nullable()->index();
            $table->json('meal_types')->nullable();
            $table->string('image_url', 2048)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('needs_review')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('recipe_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->unsignedSmallInteger('servings')->default(4);
            $table->unsignedSmallInteger('preparation_minutes')->default(0);
            $table->unsignedSmallInteger('cooking_minutes')->default(0);
            $table->json('equipment')->nullable();
            $table->json('allergens')->nullable();
            $table->json('dietary_tags')->nullable();
            $table->json('storage_guidance')->nullable();
            $table->json('child_modifications')->nullable();
            $table->json('variations')->nullable();
            $table->enum('cost_confidence', ['unknown', 'low', 'medium', 'high'])->default('unknown');
            $table->boolean('leftover_suitable')->default(false);
            $table->unsignedSmallInteger('leftover_days')->default(0);
            $table->string('content_checksum', 64);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['recipe_id', 'version']);
        });

        Schema::create('recipe_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->text('instruction');
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->timestamps();
            $table->unique(['recipe_version_id', 'position']);
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_version_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->nullable()->constrained()->nullOnDelete();
            $table->string('original_text');
            $table->decimal('original_quantity', 10, 3)->nullable();
            $table->string('original_unit', 32)->nullable();
            $table->decimal('normalized_quantity', 10, 3)->nullable();
            $table->string('normalized_unit', 16)->nullable();
            $table->enum('conversion_confidence', ['exact', 'estimated', 'unknown'])->default('unknown');
            $table->boolean('is_optional')->default(false);
            $table->timestamps();
        });

        Schema::create('recipe_nutrition_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_version_id')->constrained()->cascadeOnDelete();
            $table->json('nutrients');
            $table->string('source');
            $table->string('external_id')->nullable();
            $table->enum('confidence', ['low', 'medium', 'high', 'verified'])->default('medium');
            $table->string('calculation_version');
            $table->timestamp('calculated_at');
            $table->timestamps();
        });

        Schema::create('recipe_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('external_id');
            $table->text('source_url')->nullable();
            $table->string('license')->nullable();
            $table->string('attribution')->nullable();
            $table->enum('source_confidence', ['low', 'medium', 'high'])->default('medium');
            $table->string('payload_checksum', 64);
            $table->enum('import_status', ['active', 'stale', 'failed'])->default('active');
            $table->timestamp('imported_at');
            $table->timestamp('last_synchronized_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'external_id']);
        });

        Schema::create('recipe_duplicate_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_recipe_id')->constrained('recipes')->cascadeOnDelete();
            $table->decimal('name_similarity', 5, 4)->default(0);
            $table->decimal('ingredient_similarity', 5, 4)->default(0);
            $table->decimal('instruction_similarity', 5, 4)->default(0);
            $table->enum('status', ['pending', 'merged', 'distinct'])->default('pending');
            $table->timestamps();
            $table->unique(['recipe_id', 'candidate_recipe_id']);
        });

        Schema::create('packaged_foods', function (Blueprint $table) {
            $table->id();
            $table->string('barcode')->unique();
            $table->string('brand')->nullable();
            $table->string('name');
            $table->string('image_url', 2048)->nullable();
            $table->text('ingredients_text')->nullable();
            $table->json('allergens')->nullable();
            $table->json('markets')->nullable();
            $table->enum('confidence', ['low', 'medium', 'high'])->default('low');
            $table->timestamps();
        });

        Schema::create('packaged_food_servings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('packaged_food_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 16);
            $table->string('label')->nullable();
            $table->decimal('package_quantity', 10, 3)->nullable();
            $table->string('package_unit', 16)->nullable();
            $table->timestamps();
        });

        Schema::create('packaged_food_nutrition', function (Blueprint $table) {
            $table->id();
            $table->foreignId('packaged_food_id')->constrained()->cascadeOnDelete();
            $table->foreignId('packaged_food_serving_id')->nullable()->constrained()->cascadeOnDelete();
            $table->json('nutrients');
            $table->string('source');
            $table->string('calculation_version')->default('label-v1');
            $table->enum('confidence', ['low', 'medium', 'high'])->default('low');
            $table->timestamp('retrieved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('packaged_food_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('packaged_food_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('external_id');
            $table->text('source_url')->nullable();
            $table->string('license')->nullable();
            $table->string('payload_checksum', 64);
            $table->timestamp('imported_at');
            $table->timestamp('last_synchronized_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'external_id']);
        });

        Schema::create('pantry_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->string('unit', 16);
            $table->decimal('reserved_quantity', 12, 3)->default(0);
            $table->decimal('package_quantity', 12, 3)->nullable();
            $table->string('package_unit', 16)->nullable();
            $table->date('expires_on')->nullable();
            $table->decimal('unit_cost', 12, 4)->nullable();
            $table->char('currency', 3)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['household_id', 'ingredient_id', 'expires_on']);
        });

        Schema::create('meal_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->date('start_date');
            $table->unsignedSmallInteger('number_of_days')->default(7);
            $table->enum('status', ['draft', 'generating', 'ready', 'needs_review', 'failed', 'archived'])->default('draft');
            $table->string('priority_profile')->default('balanced');
            $table->string('generation_seed', 64)->nullable();
            $table->string('calculation_version')->default('meal-plan-v1');
            $table->enum('confidence', ['low', 'medium', 'high'])->default('high');
            $table->json('source_versions')->nullable();
            $table->json('settings')->nullable();
            $table->json('warnings')->nullable();
            $table->json('validation_results')->nullable();
            $table->text('failure_message')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['household_id', 'start_date']);
        });

        Schema::create('meal_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_version_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('batch_source_item_id')->nullable()->constrained('meal_plan_items')->nullOnDelete();
            $table->date('scheduled_date');
            $table->enum('meal_slot', ['breakfast', 'lunch', 'dinner', 'snack']);
            $table->string('participant_group')->default('shared');
            $table->time('scheduled_time')->nullable();
            $table->enum('status', ['planned', 'prepared', 'eaten', 'modified', 'replaced', 'skipped', 'missed'])->default('planned');
            $table->boolean('is_locked')->default(false);
            $table->enum('origin', ['generated', 'manual', 'replacement', 'leftover'])->default('generated');
            $table->json('score_breakdown')->nullable();
            $table->json('nutrition_snapshot')->nullable();
            $table->json('manual_overrides')->nullable();
            $table->json('warnings')->nullable();
            $table->timestamps();
            $table->unique(['meal_plan_id', 'scheduled_date', 'meal_slot', 'participant_group'], 'meal_plan_slot_unique');
        });

        Schema::create('meal_plan_portions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('household_member_id')->constrained()->cascadeOnDelete();
            $table->decimal('serving_multiplier', 8, 3)->default(1);
            $table->json('nutrition_snapshot')->nullable();
            $table->json('modifications')->nullable();
            $table->boolean('is_manual')->default(false);
            $table->timestamps();
            $table->unique(['meal_plan_item_id', 'household_member_id']);
        });

        Schema::create('pantry_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pantry_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_item_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 3);
            $table->string('unit', 16);
            $table->enum('status', ['reserved', 'released', 'consumed'])->default('reserved');
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('pantry_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pantry_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['addition', 'deduction', 'adjustment', 'release']);
            $table->decimal('quantity', 12, 3);
            $table->string('unit', 16);
            $table->string('idempotency_key', 64)->unique();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('shopping_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_id')->constrained()->cascadeOnDelete();
            $table->decimal('known_cost_total', 12, 2)->default(0);
            $table->unsignedInteger('unknown_price_count')->default(0);
            $table->char('currency', 3);
            $table->enum('budget_status', ['within', 'over', 'indeterminate'])->default('indeterminate');
            $table->timestamps();
        });

        Schema::create('shopping_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->string('category')->nullable();
            $table->decimal('required_quantity', 12, 3);
            $table->decimal('pantry_quantity', 12, 3)->default(0);
            $table->decimal('purchase_quantity', 12, 3);
            $table->string('unit', 16);
            $table->decimal('estimated_cost', 12, 2)->nullable();
            $table->enum('cost_confidence', ['unknown', 'low', 'medium', 'high'])->default('unknown');
            $table->boolean('is_checked')->default(false);
            $table->timestamps();
            $table->unique(['shopping_list_id', 'ingredient_id']);
        });

        Schema::create('meal_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_item_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('type', ['meal', 'grocery', 'preparation', 'batch_cooking', 'defrosting', 'pantry_expiry']);
            $table->string('title');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->enum('status', ['planned', 'prepared', 'eaten', 'modified', 'replaced', 'skipped', 'missed'])->default('planned');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['household_id', 'starts_at']);
        });

        Schema::create('planned_food_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shopping_list_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('diary_entry_id')->nullable()->index();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('wallet_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('finance_transaction_id')->nullable()->constrained('finance_transactions')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3);
            $table->enum('status', ['planned', 'confirmed', 'cancelled'])->default('planned');
            $table->string('idempotency_key', 64)->unique();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('meal_diary_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->cascadeOnDelete();
            $table->foreignId('household_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meal_plan_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('finance_transaction_id')->nullable()->constrained('finance_transactions')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('consumed_at');
            $table->enum('meal_slot', ['breakfast', 'lunch', 'dinner', 'snack']);
            $table->enum('status', ['planned', 'eaten_as_planned', 'modified', 'replaced', 'skipped'])->default('modified');
            $table->json('planned_nutrition_snapshot')->nullable();
            $table->json('actual_nutrition_snapshot')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('hunger_before')->nullable();
            $table->unsignedTinyInteger('fullness_after')->nullable();
            $table->string('mood')->nullable();
            $table->unsignedTinyInteger('energy_level')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['household_member_id', 'consumed_at']);
        });

        Schema::create('meal_diary_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_diary_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_version_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ingredient_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('packaged_food_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['recipe', 'food', 'packaged_food', 'restaurant', 'takeaway', 'drink', 'snack', 'leftover', 'manual']);
            $table->string('name');
            $table->decimal('quantity', 10, 3)->nullable();
            $table->string('unit', 16)->nullable();
            $table->decimal('serving_multiplier', 8, 3)->default(1);
            $table->json('nutrition_snapshot');
            $table->string('nutrition_source');
            $table->enum('nutrition_confidence', ['low', 'medium', 'high', 'verified'])->default('medium');
            $table->string('calculation_version');
            $table->json('manual_overrides')->nullable();
            $table->timestamps();
        });

        Schema::table('planned_food_expenses', function (Blueprint $table) {
            $table->foreign('diary_entry_id')->references('id')->on('meal_diary_entries')->nullOnDelete();
        });

        Schema::create('meal_provider_requests', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->index();
            $table->string('operation');
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->unsignedInteger('quota_cost')->nullable();
            $table->boolean('successful')->default(false);
            $table->text('error')->nullable();
            $table->timestamps();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('meal_household_member_id')->nullable()->constrained('household_members')->nullOnDelete();
            $table->string('source_type')->nullable()->index();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->json('source_metadata')->nullable();
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['meal_household_member_id']);
            $table->dropIndex(['source_type', 'source_id']);
            $table->dropColumn(['meal_household_member_id', 'source_type', 'source_id', 'source_metadata']);
        });

        foreach ([
            'meal_provider_requests', 'planned_food_expenses', 'meal_diary_items', 'meal_diary_entries',
            'meal_calendar_events', 'shopping_list_items', 'shopping_lists', 'pantry_movements',
            'pantry_reservations', 'meal_plan_portions', 'meal_plan_items', 'meal_plans', 'pantry_items',
            'packaged_food_sources', 'packaged_food_nutrition', 'packaged_food_servings', 'packaged_foods',
            'recipe_duplicate_candidates', 'recipe_sources', 'recipe_nutrition_snapshots', 'recipe_ingredients',
            'recipe_steps', 'recipe_versions', 'recipes', 'ingredient_package_sizes', 'regional_ingredient_prices',
            'country_ingredients', 'ingredient_substitutions', 'ingredient_sources', 'ingredient_nutrition',
            'ingredient_localizations', 'ingredient_aliases', 'ingredients', 'household_members', 'households',
            'regions', 'countries',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
