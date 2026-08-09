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
}
