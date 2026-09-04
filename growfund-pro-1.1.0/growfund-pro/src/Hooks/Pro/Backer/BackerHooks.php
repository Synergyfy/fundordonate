<?php

namespace GrowfundPro\Hooks\Pro\Backer;

use GrowfundPro\Hooks\HookProvider;

defined( 'ABSPATH' ) || exit;

class BackerHooks implements HookProvider {
    public static function get()
    {
        return [
            BackerOverviewFilter::class,
        ];
    }
}
