<?php

namespace GrowfundPro\Hooks\Pro\Fund;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class FundHooks implements HookProvider {
    public static function get()
    {
        return [
            FundListFilter::class,
        ];
    }
}
