<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceCategory;
use Illuminate\Database\Eloquent\Collection;

class FinanceCategoryRepository
{
    public function getForUser(int $userId): Collection
    {
        // `name` is encrypted at rest, so order by the decrypted value in PHP.
        return FinanceCategory::where('user_id', $userId)
            ->get()
            ->sortBy(fn (FinanceCategory $category) => mb_strtolower(trim((string) $category->name)))
            ->values();
    }

    public function findForUser(int $userId, int $categoryId): FinanceCategory
    {
        return FinanceCategory::where('user_id', $userId)->findOrFail($categoryId);
    }

    public function create(array $data): FinanceCategory
    {
        return FinanceCategory::create($data);
    }

    public function update(FinanceCategory $category, array $data): FinanceCategory
    {
        $category->update($data);

        return $category;
    }

    public function delete(FinanceCategory $category): bool
    {
        return (bool) $category->delete();
    }
}
