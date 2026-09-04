<?php

namespace GrowfundPro\Hooks\Core;

use Growfund\Constants\FeeType;
use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\Money;

class AppPaymentConfigFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_APP_PAYMENT_CONFIG_FILTER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function get_args_count()
    {
        return 2;
    }

    public function handle(...$args)
    {
        list($new_data, $original_data) = $args;

        $data = [
            'enable_platform_fee' => boolval($original_data['enable_platform_fee'] ?? false),
            'platform_fee_type' => $original_data['platform_fee_type'] ?? FeeType::PERCENTAGE,
            'platform_fee' => !empty($original_data['platform_fee']) && is_numeric($original_data['platform_fee']) 
                ? Money::prepare_for_display($original_data['platform_fee'])
                : null,
            'minimum_balance_to_request_withdrawal' => !empty($original_data['minimum_balance_to_request_withdrawal']) && is_numeric($original_data['minimum_balance_to_request_withdrawal']) 
                ? Money::prepare_for_display($original_data['minimum_balance_to_request_withdrawal'])
                : null,
            'fundraiser_withdrawal_options' => [
                'is_active_paypal' => boolval($original_data['fundraiser_withdrawal_options']['is_active_paypal'] ?? false),
                'is_active_bank_transfer' => boolval($original_data['fundraiser_withdrawal_options']['is_active_bank_transfer'] ?? false),
                'is_active_others' => boolval($original_data['fundraiser_withdrawal_options']['is_active_others'] ?? false),
            ],
            'enable_guest_checkout' => boolval($original_data['enable_guest_checkout'] ?? false),
        ];

        if (growfund_user()->is_fundraiser()) {
            return array_merge($new_data, $data);
        }

        return array_merge($original_data, $data);
    }
}
