<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeviceTokenRequest;
use App\Services\DeviceTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function __construct(
        private readonly DeviceTokenService $deviceTokens,
    ) {}

    /**
     * Register (upsert) the caller's device push token.
     *
     * Session-authed web route returning JSON — the remote-URL Capacitor
     * wrapper posts here using the shared web-session cookie.
     */
    public function store(StoreDeviceTokenRequest $request): JsonResponse
    {
        $this->deviceTokens->register($request->user(), $request->validated());

        return response()->json(['ok' => true], 201);
    }

    /**
     * Unregister a device push token (e.g. on logout).
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:512'],
        ]);

        $this->deviceTokens->delete($request->user(), $validated['token']);

        return response()->json(['ok' => true]);
    }
}
