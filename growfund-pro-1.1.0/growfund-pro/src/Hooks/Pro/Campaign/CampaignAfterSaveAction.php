<?php

namespace GrowfundPro\Hooks\Pro\Campaign;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\PostMeta;
use GrowfundPro\Services\CampaignService;

class CampaignAfterSaveAction extends BaseHook{
	public function get_name()
    {
        return ProHookNames::GROWFUND_CAMPAIGN_AFTER_SAVE_ACTION;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function get_args_count()
    {
        return 2;
    }

    public function handle(...$args)
    {
        list($id, $dto) = $args;

        $campaign_service = new CampaignService();

        PostMeta::update_many($id, $dto->only(['start_date']));
        
        $campaign_service->sync_collaborators($id, $dto->collaborators);
    }
}
