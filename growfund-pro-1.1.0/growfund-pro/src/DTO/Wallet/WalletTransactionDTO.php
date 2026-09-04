<?php

namespace GrowfundPro\DTO\Wallet;

defined( 'ABSPATH' ) || exit;

use Growfund\CastAttributes\DateTimeAttribute;
use Growfund\CastAttributes\MoneyAttribute;
use Growfund\CastAttributes\StringAttribute;
use Growfund\DTO\DTO;

class WalletTransactionDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var int */
    public $wallet_id;

    /** @var int|null */
    public $campaign_id;

    /** @var int|null -- pledge_id|donation_id|withdrawal_request_id */
    public $reference_id;

    /** @var string|null -- pledge|donation|withdrawal_request */
    public $reference_type;

    /** @var int */
    public $amount;

    /** @var string */
    public $type;

    /** @var string */
    public $status;

    /** @var string -- debit|credit */
    public $action;

    /** @var string */
    public $created_at;

    protected $casts = [
        'id' => StringAttribute::class,
        'wallet_id' => StringAttribute::class,
        'campaign_id' => StringAttribute::class,
        'reference_id' => StringAttribute::class,
        'amount' => MoneyAttribute::class,
        'created_at' => DateTimeAttribute::class,
    ];
}
