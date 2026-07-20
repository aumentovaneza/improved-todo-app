<?php

namespace App\Support;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;

/**
 * Helpers for searching and paginating over columns that are encrypted at rest.
 *
 * Encrypted columns hold non-deterministic ciphertext, so they cannot be used
 * in SQL WHERE/LIKE/ORDER BY clauses. These helpers mirror the old
 * `LIKE '%term%'` behaviour (case-insensitive substring match) against the
 * DECRYPTED value in PHP, and rebuild a LengthAwarePaginator with the same
 * JSON prop shape the frontend already consumes.
 */
class EncryptedSearch
{
    /**
     * Case-insensitive substring match, mirroring SQL `LIKE '%term%'`.
     */
    public static function matches(?string $haystack, string $needle): bool
    {
        if ($haystack === null || $haystack === '') {
            return false;
        }

        if ($needle === '') {
            return true;
        }

        return mb_stripos($haystack, $needle) !== false;
    }

    /**
     * Build a LengthAwarePaginator from an already-filtered/sorted collection,
     * preserving the request page name and query string.
     */
    public static function paginate(
        Collection $items,
        int $perPage,
        string $pageName = 'page',
        ?int $page = null
    ): LengthAwarePaginator {
        $page = $page ?: Paginator::resolveCurrentPage($pageName);

        $results = $items->forPage($page, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $results,
            $items->count(),
            $perPage,
            $page,
            [
                'path' => Paginator::resolveCurrentPath(),
                'pageName' => $pageName,
            ]
        );

        return $paginator->withQueryString();
    }
}
