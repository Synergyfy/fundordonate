<?php

namespace GrowfundPro\Hooks\Pro\Fundraiser;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\CampaignService;

class FundraiserCampaignIdsQueryFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_FUNDRAISER_CAMPAIGN_IDS_QUERY_FILTER;
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
        list($query, $fundraiser_id) = $args;
        
        if (!empty($fundraiser_id) && is_numeric($fundraiser_id)) {
            $campaign_service = new CampaignService();
            $query = $campaign_service->get_campaign_ids_by_fundraiser_query($fundraiser_id);
        }

        return $query;
    }
}
