<?php

namespace GrowfundPro\Hooks\Pro\Backer;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\BackerService;

class BackerOverviewFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_BACKER_OVERVIEW_FILTER;
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
        list($data, $backer_id) = $args;
        
        $service = new BackerService();

        return $service->get_overview($backer_id);
    }
}
