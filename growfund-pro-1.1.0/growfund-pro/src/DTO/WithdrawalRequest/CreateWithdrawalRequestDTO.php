<?php

namespace GrowfundPro\DTO\WithdrawalRequest;

defined( 'ABSPATH' ) || exit;

use Growfund\Core\AppSettings;
use Growfund\DTO\DTO;
use Growfund\Sanitizer;
use Growfund\Supports\Money;
use GrowfundPro\Services\WalletService;

class CreateWithdrawalRequestDTO extends DTO
{
    /** @var int */
    public $user_id;

    /** @var int */
    public $amount;

    /** @var string */
    public $method;

    /** @var string */
    public $status;

    /** @var string json */
    public $payout_info;

    /** @var string */
    public $created_at;

    public static function validation_rules()
    {   
        $minimum_required_amount = growfund_settings(AppSettings::PAYMENT)->get_minimum_balance_to_request_withdrawal() ?? 0;

        return [
            'amount' => [
                'required',
                'float',
                'min:' . Money::prepare_for_display($minimum_required_amount),
                function ($value) {
                    $wallet_service = new WalletService();
                    $info = $wallet_service->get_fundraiser_wallet_info(growfund_user()->get_id(), true);

                    if (empty($info)) {
                        return __('Wallet not found', 'growfund-pro');
                    }

                    $amount = Money::prepare_for_storage($value);

                    if ($amount > $info->available_withdraw_amount) {
                        return sprintf(
                            /* translators: %s: available amount */
                            __('You have only %s available to withdraw.', 'growfund-pro'), 
                            Money::prepare_for_display($info->available_withdraw_amount)
                        );
                    }

                    return true;
                }
            ]
        ];
    }

    public static function sanitization_rules()
    {
        return [
            'amount' => Sanitizer::MONEY
        ];
    }
}
