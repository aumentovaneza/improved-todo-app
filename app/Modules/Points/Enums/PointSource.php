<?php

namespace App\Modules\Points\Enums;

enum PointSource: string
{
    case TaskCompletion = 'task_completion';
    case SubtaskCompletion = 'subtask_completion';
    case DailyStreak = 'daily_streak';
    case PomodoroSession = 'pomodoro_session';
    case StorePurchase = 'store_purchase';
    case PurchaseRefund = 'purchase_refund';
    case AdminAdjust = 'admin_adjust';

    public function label(): string
    {
        return match ($this) {
            self::TaskCompletion => 'Task completed',
            self::SubtaskCompletion => 'Subtask completed',
            self::DailyStreak => 'Daily streak',
            self::PomodoroSession => 'Focus session',
            self::StorePurchase => 'Store purchase',
            self::PurchaseRefund => 'Purchase refund',
            self::AdminAdjust => 'Admin adjustment',
        };
    }
}
