<?php

namespace GrowfundPro\Hooks\Pro\Reward;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class RewardHooks implements HookProvider {
    public static function get()
    {
        return [
            RewardValidationRuleFilter::class,
        ];
    }
}
