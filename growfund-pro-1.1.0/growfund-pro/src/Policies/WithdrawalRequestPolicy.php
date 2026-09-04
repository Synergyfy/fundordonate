<?php

namespace GrowfundPro\Policies;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\UserTypes\Admin;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Exceptions\AuthorizationException;
use Growfund\Policies\BasePolicy;

/**
 * @method void authorize_paginated()
 * @method void authorize_create()
 * @method void authorize_update()
 */
class WithdrawalRequestPolicy extends BasePolicy
{
    public function paginated()
    {
        if (!growfund_user()->has_active_role(Fundraiser::ROLE)) {
            throw new AuthorizationException(esc_html__('You do not have permission for this action', 'growfund-pro'));
        }
    }

    public function create()
    {
        if (!growfund_user()->has_active_role(Fundraiser::ROLE)) {
            throw new AuthorizationException(esc_html__('You do not have permission for this action', 'growfund-pro'));
        }
    }

    public function update()
    {
        if (!growfund_user()->has_active_role(Admin::ROLE)) {
            throw new AuthorizationException(esc_html__('You do not have permission for this action', 'growfund-pro'));
        }
    }
}
