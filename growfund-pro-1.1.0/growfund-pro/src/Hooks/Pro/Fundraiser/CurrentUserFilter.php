<?php

namespace GrowfundPro\Hooks\Pro\Fundraiser;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\UserTypes\Fundraiser;
use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\FundraiserService;

class CurrentUserFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_CURRENT_USER_FILTER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $user = $args[0];

        if ($user['active_role'] === Fundraiser::ROLE) {
            $payout_data = (new FundraiserService())->get_payout_method($user['id']);

            $user['payout_method'] = !empty($payout_data) ? $payout_data->get_values() : null;
        }

        return $user;
    }
}
