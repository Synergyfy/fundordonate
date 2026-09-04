<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\Money;

class BeforeAppConfigUpdateFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_BEFORE_APP_CONFIG_UPDATE_FILTER;
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

        return array_merge($original_data, [
            'platform_fee' => !empty($original_data['platform_fee']) && is_numeric($original_data['platform_fee']) 
                ? Money::prepare_for_storage($original_data['platform_fee'])
                : null,
            'minimum_balance_to_request_withdrawal' => !empty($original_data['minimum_balance_to_request_withdrawal']) && is_numeric($original_data['minimum_balance_to_request_withdrawal']) 
                ? Money::prepare_for_storage($original_data['minimum_balance_to_request_withdrawal'])
                : null,
        ]);
    }
}
