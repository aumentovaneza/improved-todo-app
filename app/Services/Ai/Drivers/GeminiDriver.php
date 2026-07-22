<?php

namespace App\Services\Ai\Drivers;

use App\Services\Ai\Contracts\TextGenerator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiDriver implements TextGenerator
{
    public function __construct(
        private ?string $apiKey,
        private string $model = 'gemini-1.5-flash'
    ) {}

    public function generate(string $system, string $prompt, array $options = []): string
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $model = $options['model'] ?? $this->model;
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(30)
            ->post($url, [
                'systemInstruction' => [
                    'parts' => [['text' => $system]],
                ],
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [['text' => $prompt]],
                    ],
                ],
            ]);

        $response->throw();

        return (string) $response->json('candidates.0.content.parts.0.text', '');
    }
}
