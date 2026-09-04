<?php

namespace GrowfundPro\Actions;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\UserTypes\Collaborator;
use Growfund\Contracts\Action;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Supports\User as UserSupport;

class RegisterRoles implements Action
{
    public function handle()
    {
        if (method_exists(UserSupport::class, 'register_role')) {
            UserSupport::register_role(Fundraiser::ROLE, Fundraiser::TITLE);
            UserSupport::register_role(Collaborator::ROLE, Collaborator::TITLE);
        }
    }
}
