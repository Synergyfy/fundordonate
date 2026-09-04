<?php

namespace GrowfundPro\Hooks\Pro\Donor;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class DonorHooks implements HookProvider {
    public static function get()
    {
        return [
            DonorOverviewFilter::class,
        ];
    }
}
