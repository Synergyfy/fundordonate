<?php

namespace GrowfundPro\Hooks\Pro\Settings\SecuritySettings;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class EnableEmailVerificationFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_ALLOW_EMAIL_VERIFICATION;
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
        
		return isset($settings['is_enabled_email_verification'])
            ? filter_var($settings['is_enabled_email_verification'], FILTER_VALIDATE_BOOLEAN)
            : false;
    }
}
