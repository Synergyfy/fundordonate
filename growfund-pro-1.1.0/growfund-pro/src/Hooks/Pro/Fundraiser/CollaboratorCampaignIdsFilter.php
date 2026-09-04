<?php

namespace GrowfundPro\Hooks\Pro\Fundraiser;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\CampaignService;

class CollaboratorCampaignIdsFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_COLLABORATOR_CAMPAIGN_IDS_FILTER;
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
        list($campaign_ids, $collaborator_id) = $args;
        
        if (!empty($collaborator_id) && is_numeric($collaborator_id)) {
            $campaign_service = new CampaignService();
            $campaign_ids = $campaign_service->get_campaign_ids_by_collaborator($collaborator_id);
        }

        return $campaign_ids;
    }
}
