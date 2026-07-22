<?php

namespace App\Services\Ai\Drivers;

use App\Services\Ai\Contracts\TextGenerator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AnthropicDriver implements TextGenerator
{
    public function __construct(
        private ?string $apiKey,
        private string $model = 'claude-sonnet-5'
    ) {}

    public function generate(string $system, string $prompt, array $options = []): string
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('Anthropic API key is not configured.');
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])
            ->timeout(30)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => $options['model'] ?? $this->model,
                'max_tokens' => $options['max_tokens'] ?? 1024,
                'system' => $system,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        $response->throw();

        return (string) $response->json('content.0.text', '');
    }
}
