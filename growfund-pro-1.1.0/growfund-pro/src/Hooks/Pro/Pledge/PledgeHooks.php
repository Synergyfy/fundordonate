<?php

namespace GrowfundPro\Hooks\Pro\Pledge;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class PledgeHooks implements HookProvider {
    public static function get()
    {
        return [
            PledgeAfterBackedAction::class,
        ];
    }
}
