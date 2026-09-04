<?php

namespace GrowfundPro\Policies;

defined( 'ABSPATH' ) || exit;

use Growfund\Exceptions\AuthorizationException;
use Growfund\Policies\BasePolicy;

/**
 * @method void authorize_paginated(int|null $user_id = null)
 * @method void authorize_create(int|null $user_id = null)
 */
class CollaboratorPolicy extends BasePolicy
{
    public function paginated($user_id = null)
    {
        if (!growfund_user($user_id)->is_fundraiser()) {
            throw new AuthorizationException(esc_html__('You do not have permission for this action', 'growfund'));
        }
    }

    public function create($user_id = null)
    {
        if (!growfund_user($user_id)->is_fundraiser()) {
            throw new AuthorizationException(esc_html__('You do not have permission for this action', 'growfund'));
        }
    }
}
