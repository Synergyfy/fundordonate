<?php

namespace GrowfundPro\Hooks\Pro\Settings\PermissionSettings;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class FundraiserCampaignPublishFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_FUNDRAISER_CAMPAIGN_PUBLISH_FILTER;
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
        
		return isset($settings['fundraisers_can_publish_campaigns'])
            ? filter_var($settings['fundraisers_can_publish_campaigns'], FILTER_VALIDATE_BOOLEAN)
            : false;
    }
}
