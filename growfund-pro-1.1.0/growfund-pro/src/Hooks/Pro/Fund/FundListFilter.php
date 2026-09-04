<?php

namespace GrowfundPro\Hooks\Pro\Fund;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\FundService;

class FundListFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_FUND_LIST_FILTER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function get_args_count()
    {
        return 1;
    }

    public function handle(...$args)
    {   
        $service = new FundService();

        return $service->all();
    }
}
