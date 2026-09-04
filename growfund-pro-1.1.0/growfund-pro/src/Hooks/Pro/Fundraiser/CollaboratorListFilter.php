<?php

namespace GrowfundPro\Hooks\Pro\Fundraiser;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\CampaignService;
use GrowfundPro\Services\FundraiserService;

class CollaboratorListFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_COLLABORATOR_LIST_FILTER;
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
        list($list, $campaign_id) = $args;

        if (!empty($campaign_id) && is_numeric($campaign_id)) {
            $service = new FundraiserService();
            $campaign_service = new CampaignService();

            $collaborator_ids = $campaign_service->get_collaborator_ids_by_campaign_id($campaign_id);

            $list = $service->get_collaborators_by_user_ids($collaborator_ids);
        }

        return $list;
    }
}
