<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastActive
{
    /**
     * Number of seconds to wait before writing a fresh last_active_at value.
     */
    private const THROTTLE_SECONDS = 60;

    /**
     * Bump the authenticated user's last_active_at timestamp.
     *
     * The write is throttled so we only touch the database at most once per
     * THROTTLE_SECONDS. It writes through the query builder directly so it does
     * not bump updated_at or fire model events, keeping the request cheap and
     * side-effect free.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User) {
            $now = now();
            $lastActive = $user->last_active_at !== null
                ? Carbon::parse($user->last_active_at)
                : null;

            if ($lastActive === null || $lastActive->lte($now->copy()->subSeconds(self::THROTTLE_SECONDS))) {
                DB::table($user->getTable())
                    ->where($user->getKeyName(), $user->getKey())
                    ->update(['last_active_at' => $now]);

                $user->last_active_at = $now;
            }
        }

        return $next($request);
    }
}
