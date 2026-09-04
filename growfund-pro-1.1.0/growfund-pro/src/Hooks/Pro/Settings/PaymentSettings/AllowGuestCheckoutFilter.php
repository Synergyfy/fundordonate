<?php

namespace GrowfundPro\Hooks\Pro\Settings\PaymentSettings;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class AllowGuestCheckoutFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_ALLOW_GUEST_CHECKOUT_FILTER;
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
        $value = $args[0];
        $settings = $args[1];
        
		return isset($settings['enable_guest_checkout'])
            ? filter_var($settings['enable_guest_checkout'], FILTER_VALIDATE_BOOLEAN)
            : false;
    }
}
