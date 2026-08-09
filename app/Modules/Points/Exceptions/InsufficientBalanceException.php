<?php

namespace App\Modules\Points\Exceptions;

use RuntimeException;

class InsufficientBalanceException extends RuntimeException
{
    public static function forPurchase(int $balance, int $cost): self
    {
        return new self("Insufficient point balance: have {$balance}, need {$cost}.");
    }
}
