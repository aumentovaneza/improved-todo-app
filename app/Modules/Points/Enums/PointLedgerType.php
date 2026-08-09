<?php

namespace App\Modules\Points\Enums;

enum PointLedgerType: string
{
    case Earn = 'earn';
    case Spend = 'spend';
    case Adjust = 'adjust';
    case Refund = 'refund';
}
