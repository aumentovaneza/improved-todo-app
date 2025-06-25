<?php

namespace App\Http\Controllers;

use Google\Client;
use Google\Service\Calendar;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
class GoogleCalendarController extends Controller
{
    public function redirect() {

        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect'));
        $client->addScope(Calendar::CALENDAR);

        return $client->createAuthUrl();    
    }

    public function callback(Request $request) {
        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect'));
        $client->addScope(Calendar::CALENDAR);

        // ✅ Updated method to fetch access token
        $token = $client->fetchAccessTokenWithAuthCode($request->input('code'));

        // Handle token error
        if (isset($token['error'])) {
            return redirect()->route('tasks.index')->with('error', 'Failed to connect to Google Calendar.');
        }

        // Store the token securely
        $user = Auth::user();
        $user->update([
            'google_token' => encrypt($token['access_token']),
            'google_refresh_token' => isset($token['refresh_token']) ? encrypt($token['refresh_token']) : $user->google_refresh_token,
            'google_token_expires' => now()->addSeconds($token['expires_in']),
        ]);

        return redirect()->route('tasks.index')->with('success', 'Google Calendar connected!');
        
    }
}
