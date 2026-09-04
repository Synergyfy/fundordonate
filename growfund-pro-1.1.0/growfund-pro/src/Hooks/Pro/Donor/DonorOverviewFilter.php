<?php

namespace GrowfundPro\Hooks\Pro\Donor;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Services\DonorService;

class DonorOverviewFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_DONOR_OVERVIEW_FILTER;
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
        list($data, $donor_id) = $args;
        
        $service = new DonorService();

        return $service->get_overview($donor_id);
    }
}
