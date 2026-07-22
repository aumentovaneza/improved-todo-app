<?php

namespace App\Services\Ai\Contracts;

interface TextGenerator
{
    /**
     * Generate text from a system prompt and a user prompt.
     *
     * @param  array<string, mixed>  $options
     *
     * @throws \Throwable when the provider fails or returns a non-2xx response.
     */
    public function generate(string $system, string $prompt, array $options = []): string;
}
