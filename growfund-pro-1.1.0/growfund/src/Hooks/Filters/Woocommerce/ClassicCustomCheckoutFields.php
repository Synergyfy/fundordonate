<?php

namespace Growfund\Hooks\Filters\Woocommerce;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\HookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class ClassicCustomCheckoutFields extends BaseHook
{
    public function get_name()
    {
        return HookNames::WC_CLASSIC_CHECKOUT_FIELDS;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $fields = $args[0];

        if (growfund_is_wc_checkout()) {
            return [];
        }

        return $fields;
    }
}
