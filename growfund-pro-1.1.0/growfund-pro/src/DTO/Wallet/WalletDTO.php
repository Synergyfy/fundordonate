<?php

namespace GrowfundPro\DTO\Wallet;

defined( 'ABSPATH' ) || exit;

use Growfund\CastAttributes\DateTimeAttribute;
use Growfund\CastAttributes\MoneyAttribute;
use Growfund\CastAttributes\StringAttribute;
use Growfund\DTO\DTO;

class WalletDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var int */
    public $user_id;

    /** @var int */
    public $balance;

    /** @var int */
    public $requested_amount;

    /** @var int */
    public $withdraw_amount;

    /** @var int */
    public $platform_fee;

    /** @var string|null */
    public $updated_at;

    protected $casts = [
        'id' => StringAttribute::class,
        'user_id' => StringAttribute::class,
        'balance' => MoneyAttribute::class,
        'requested_amount' => MoneyAttribute::class,
        'withdraw_amount' => MoneyAttribute::class,
        'platform_fee' => MoneyAttribute::class,
        'updated_at' => DateTimeAttribute::class
    ];
}
