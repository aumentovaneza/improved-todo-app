<?php

namespace App\Services\Ai\Drivers;

use App\Services\Ai\Contracts\TextGenerator;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiDriver implements TextGenerator
{
    public function __construct(
        private ?string $apiKey,
        private string $model = 'gpt-4o-mini'
    ) {}

    public function generate(string $system, string $prompt, array $options = []): string
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('OpenAI API key is not configured.');
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $options['model'] ?? $this->model,
                'max_tokens' => $options['max_tokens'] ?? 1024,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        $response->throw();

        return (string) $response->json('choices.0.message.content', '');
    }
}
