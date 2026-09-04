<?php

namespace GrowfundPro\DTO\Wallet;

defined( 'ABSPATH' ) || exit;

use Growfund\CastAttributes\MoneyAttribute;
use Growfund\DTO\DTO;

class FundraiserWalletDTO extends DTO
{

    /** @var int */
    public $available_withdraw_amount;

    /** @var int */
    public $net_balance;

    /** @var int */
    public $pending_amount;

    /** @var int */
    public $total_withdrawal_amount;


    protected $casts = [
        'available_withdraw_amount' => MoneyAttribute::class,
        'net_balance' => MoneyAttribute::class,
        'pending_amount' => MoneyAttribute::class,
        'total_withdrawal_amount' => MoneyAttribute::class,
    ];
}
