<?php

namespace GrowfundPro\Hooks\Pro\Campaign;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\CampaignService;

class CampaignAfterPermanentDeleteAction extends BaseHook{
	public function get_name()
    {
        return ProHookNames::GROWFUND_CAMPAIGN_AFTER_PERMANENT_DELETE_ACTION;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        list($id) = $args;
        $campaign_service = new CampaignService();
        $campaign_service->sync_collaborators($id, []);
    }
}
