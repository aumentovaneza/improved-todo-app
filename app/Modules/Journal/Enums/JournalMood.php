<?php

namespace App\Modules\Journal\Enums;

enum JournalMood: string
{
    case Great = 'great';
    case Good = 'good';
    case Okay = 'okay';
    case Bad = 'bad';
    case Awful = 'awful';
    case Happy = 'happy';
    case Excited = 'excited';
    case Loved = 'loved';
    case Grateful = 'grateful';
    case Calm = 'calm';
    case Motivated = 'motivated';
    case Tired = 'tired';
    case Anxious = 'anxious';
    case Stressed = 'stressed';
    case Sad = 'sad';
    case Angry = 'angry';
    case Sick = 'sick';

    public function label(): string
    {
        return match ($this) {
            self::Great => 'Great',
            self::Good => 'Good',
            self::Okay => 'Okay',
            self::Bad => 'Bad',
            self::Awful => 'Awful',
            self::Happy => 'Happy',
            self::Excited => 'Excited',
            self::Loved => 'Loved',
            self::Grateful => 'Grateful',
            self::Calm => 'Calm',
            self::Motivated => 'Motivated',
            self::Tired => 'Tired',
            self::Anxious => 'Anxious',
            self::Stressed => 'Stressed',
            self::Sad => 'Sad',
            self::Angry => 'Angry',
            self::Sick => 'Sick',
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
            self::Happy => '😊',
            self::Excited => '🤩',
            self::Loved => '🥰',
            self::Grateful => '🙏',
            self::Calm => '😌',
            self::Motivated => '💪',
            self::Tired => '😴',
            self::Anxious => '😰',
            self::Stressed => '😫',
            self::Sad => '😔',
            self::Angry => '😠',
            self::Sick => '🤒',
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
