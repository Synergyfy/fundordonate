<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\Status\FundraiserStatus;
use Growfund\Core\AppSettings;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\User as UserSupport;
use WP_Error;

class RestrictUserFromLogin extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::WP_AUTHENTICATE_USER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function get_priority()
    {
        return 30;
    }

    public function handle(...$args)
    {
        list($user) = $args;

        if (UserSupport::is_fundraiser($user)) {
            if (UserSupport::get_status($user->ID) !== FundraiserStatus::ACTIVE) {
                return new WP_Error(
                'fundraiser_not_active',
                __('Your account is not approved yet.', 'growfund')
				);
            }
        }

        if (growfund_settings(AppSettings::SECURITY)->is_enabled_email_verification() && !UserSupport::is_verified($user)) {
            return new WP_Error(
                'email_not_verified',
                __('You must verify your email before logging in.', 'growfund')
            );
        }

        return $user;
    }
}
