<?php

namespace Database\Seeders;

use App\Modules\Points\Enums\StoreItemSlot;
use App\Modules\Points\Enums\StoreItemType;
use App\Modules\Points\Models\StoreItem;
use Illuminate\Database\Seeder;

/**
 * Seeds the Phase 1 avatar-base catalog.
 *
 * Art pipeline: bases are pre-generated (OpenArt) transparent PNGs on a fixed
 * 512x512 canvas and committed under public/images/avatars/bases/<key>.png.
 * The `asset` column stores the "bases/<key>" path resolved by AvatarService.
 * Files may not exist yet — the frontend renders an initials fallback until
 * the art lands. Add new drops by appending rows here.
 */
class PointsStoreCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $bases = [
            [
                'key' => 'avatar_base_default',
                'name' => 'Starter',
                'description' => 'The free starter avatar every account begins with.',
                'cost' => 0,
                'is_default' => true,
                'sort_order' => 0,
            ],
            [
                'key' => 'avatar_base_fox',
                'name' => 'Fox',
                'description' => 'A clever little fox to focus with.',
                'cost' => 50,
                'is_default' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'avatar_base_owl',
                'name' => 'Owl',
                'description' => 'A night-owl companion for late sessions.',
                'cost' => 75,
                'is_default' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'avatar_base_cat',
                'name' => 'Cat',
                'description' => 'A calm cat that keeps you company.',
                'cost' => 100,
                'is_default' => false,
                'sort_order' => 3,
            ],
            [
                'key' => 'avatar_base_robot',
                'name' => 'Robot',
                'description' => 'A productivity-optimized robot buddy.',
                'cost' => 150,
                'is_default' => false,
                'sort_order' => 4,
            ],
            [
                'key' => 'avatar_base_dragon',
                'name' => 'Dragon',
                'description' => 'A legendary dragon for streak champions.',
                'cost' => 250,
                'is_default' => false,
                'sort_order' => 5,
            ],
        ];

        foreach ($bases as $base) {
            $key = $base['key'];
            $assetKey = str_replace('avatar_base_', '', $key);

            StoreItem::updateOrCreate(
                ['key' => $key],
                [
                    'name' => $base['name'],
                    'description' => $base['description'],
                    'type' => StoreItemType::AvatarBase->value,
                    'slot' => StoreItemSlot::Base->value,
                    'cost' => $base['cost'],
                    'asset' => 'bases/'.$assetKey.'.png',
                    'preview_asset' => 'bases/preview/'.$assetKey.'.png',
                    'sort_order' => $base['sort_order'],
                    'is_active' => true,
                    'is_default' => $base['is_default'],
                    'is_premium' => false,
                ]
            );
        }
    }
}
