<?php

namespace GrowfundPro\Hooks\Pro\Settings\PermissionSettings;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class FundraiserCampaignDeletionFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_FUNDRAISER_CAMPAIGN_DELETION_FILTER;
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
        
		return isset($settings['fundraisers_can_delete_campaigns'])
            ? filter_var($settings['fundraisers_can_delete_campaigns'], FILTER_VALIDATE_BOOLEAN)
            : false;
    }
}
