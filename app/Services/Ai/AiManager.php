<?php

namespace App\Services\Ai;

use App\Services\Ai\Drivers\AnthropicDriver;
use App\Services\Ai\Drivers\GeminiDriver;
use App\Services\Ai\Drivers\OpenAiDriver;
use Illuminate\Support\Manager;

class AiManager extends Manager
{
    /**
     * The default text-generation driver name.
     */
    public function getDefaultDriver(): string
    {
        return (string) $this->config->get('ai.default', 'anthropic');
    }

    public function createAnthropicDriver(): AnthropicDriver
    {
        return new AnthropicDriver(
            $this->config->get('ai.providers.anthropic.key'),
            (string) $this->config->get('ai.providers.anthropic.model', 'claude-sonnet-5'),
        );
    }

    public function createOpenaiDriver(): OpenAiDriver
    {
        return new OpenAiDriver(
            $this->config->get('ai.providers.openai.key'),
            (string) $this->config->get('ai.providers.openai.model', 'gpt-4o-mini'),
        );
    }

    public function createGeminiDriver(): GeminiDriver
    {
        return new GeminiDriver(
            $this->config->get('ai.providers.gemini.key'),
            (string) $this->config->get('ai.providers.gemini.model', 'gemini-1.5-flash'),
        );
    }
}
