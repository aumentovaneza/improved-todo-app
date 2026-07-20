<?php

namespace App\Modules\Journal\Enums;

enum JournalMood: string
{
    case Great = 'great';
    case Good = 'good';
    case Okay = 'okay';
    case Bad = 'bad';
    case Awful = 'awful';

    public function label(): string
    {
        return match ($this) {
            self::Great => 'Great',
            self::Good => 'Good',
            self::Okay => 'Okay',
            self::Bad => 'Bad',
            self::Awful => 'Awful',
        };
    }

    public function emoji(): string
    {
        return match ($this) {
            self::Great => '😄',
            self::Good => '🙂',
            self::Okay => '😐',
            self::Bad => '🙁',
            self::Awful => '😢',
        };
    }

    /**
     * @return array<int, array{value: string, label: string, emoji: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $mood): array => [
                'value' => $mood->value,
                'label' => $mood->label(),
                'emoji' => $mood->emoji(),
            ],
            self::cases()
        );
    }
}
