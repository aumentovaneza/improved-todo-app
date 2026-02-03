<?php

namespace App\Modules\Finance\Enums;

enum FinanceAccountInstitution: string
{
    case BDO = 'BDO';
    case BPI = 'BPI';
    case METROBANK = 'Metrobank';
    case UNIONBANK = 'UnionBank';
    case SECURITY_BANK = 'Security Bank';
    case PNB = 'PNB';
    case RCBC = 'RCBC';
    case LANDBANK = 'LandBank';
    case CHINABANK = 'Chinabank';
    case EASTWEST = 'EastWest';
    case AUB = 'AUB';
    case PSBANK = 'PSBank';

    case GCASH = 'GCash';
    case MAYA = 'Maya';
    case GRABPAY = 'GrabPay';
    case SHOPEEPAY = 'ShopeePay';
    case COINSPH = 'Coins.ph';
    case GOTYME = 'GoTyme';
    case DISKARTECH = 'DiskarTech';
    case TONIK = 'TONIK';
    case BPI_BANKO = 'BPI BanKo';
    case WISE = ' Wise';

    case BDO_CREDIT_CARD = 'BDO Credit Card';
    case BPI_CREDIT_CARD = 'BPI Credit Card';
    case METROBANK_CREDIT_CARD = 'Metrobank Credit Card';
    case UNIONBANK_CREDIT_CARD = 'UnionBank Credit Card';
    case SECURITY_BANK_CREDIT_CARD = 'Security Bank Credit Card';
    case RCBC_CREDIT_CARD = 'RCBC Credit Card';
    case CITI_CREDIT_CARD = 'Citi Credit Card';
    case PNB_CREDIT_CARD = 'PNB Credit Card';
    case MAYA_CREDIT_CARD = 'Maya Credit Card';

    public function type(): string
    {
        return match ($this) {
            self::BDO,
            self::BPI,
            self::METROBANK,
            self::UNIONBANK,
            self::SECURITY_BANK,
            self::PNB,
            self::RCBC,
            self::LANDBANK,
            self::CHINABANK,
            self::EASTWEST,
            self::AUB,
            self::PSBANK => 'bank',
            self::GCASH,
            self::MAYA,
            self::GRABPAY,
            self::SHOPEEPAY,
            self::COINSPH,
            self::GOTYME,
            self::DISKARTECH,
            self::TONIK,
            self::BPI_BANKO,
            self::WISE => 'e-wallet',
            default => 'credit-card',
        };
    }

    public static function suggestionsByType(): array
    {
        $grouped = [
            'bank' => [],
            'e-wallet' => [],
            'credit-card' => [],
        ];

        foreach (self::cases() as $case) {
            $grouped[$case->type()][] = $case->value;
        }

        return $grouped;
    }
}
