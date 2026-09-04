<?php

namespace GrowfundPro\DTO\WithdrawalRequest;

defined( 'ABSPATH' ) || exit;

use Growfund\CastAttributes\DateTimeAttribute;
use Growfund\CastAttributes\MoneyAttribute;
use Growfund\Constants\UserTypes\Admin;
use Growfund\DTO\DTO;
use Growfund\DTO\User\UserInfoDTO;
use GrowfundPro\DTO\Fundraiser\PayoutMethodDTO;

class WithdrawalRequestDTO extends DTO
{
    public function __construct(array $data = [])
    {
        parent::__construct($data);

        if (!growfund_user()->has_active_role(Admin::ROLE)) {
            $this->exclude(['attachment', 'payout_info']);
        }
    }

    /** @var string */
    public $id;

    /** @var UserInfoDTO */
    public $fundraiser;

    /** @var int */
    public $amount;

    /** @var string */
    public $method;

    /** @var string */
    public $status;

    /** @var string|null */
    public $note;

    /** @var string|null */
    public $attachment;

    public $has_attachment = false;

    /** @var PayoutMethodDTO */
    public $payout_info;

    /** @var string */
    public $created_at;

    /** @var string|null */
    public $updated_by;

    /** @var string|null */
    public $updated_at;

    protected $casts = [
        'fundraiser' => UserInfoDTO::class,
        'amount' => MoneyAttribute::class,
        'created_at' => DateTimeAttribute::class,
        'updated_at' => DateTimeAttribute::class,
        'payout_info' => PayoutMethodDTO::class,
    ];
}
