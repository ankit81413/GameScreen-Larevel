<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RazorpayDonationController extends Controller
{
    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'wallpaper_code' => ['nullable', 'string', 'max:64'],
        ]);

        $keyId = trim((string) config('services.razorpay.key_id', ''));
        $keySecret = trim((string) config('services.razorpay.key_secret', ''));

        if ($keyId === '' || $keySecret === '') {
            return response()->json([
                'message' => 'Razorpay is not configured.',
            ], 500);
        }

        $amount = (int) config('services.razorpay.donation_amount_paise', 4900);
        if ($amount < 100) {
            $amount = 100;
        }

        $currency = strtoupper((string) config('services.razorpay.currency', 'INR'));
        $wallpaperCode = trim((string) ($validated['wallpaper_code'] ?? ''));
        $receiptSuffix = $wallpaperCode !== '' ? $wallpaperCode : Str::upper(Str::random(8));

        $response = Http::withBasicAuth($keyId, $keySecret)
            ->timeout(15)
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => $amount,
                'currency' => $currency,
                'receipt' => 'donation_' . Str::limit($receiptSuffix, 24, ''),
                'notes' => [
                    'wallpaper_code' => $wallpaperCode,
                ],
            ]);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to create Razorpay order.',
            ], 502);
        }

        $order = $response->json();

        return response()->json([
            'key' => $keyId,
            'order_id' => $order['id'] ?? null,
            'amount' => $amount,
            'currency' => $currency,
            'name' => config('app.name', 'GameScreen'),
            'description' => 'Support the creator',
            'prefill' => [
                'name' => $request->user()?->name,
                'email' => $request->user()?->email,
            ],
        ]);
    }
}

