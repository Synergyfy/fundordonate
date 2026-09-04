<?php

namespace GrowfundPro\Hooks\Pro\Campaign;

use GrowfundPro\Hooks\HookProvider;

defined( 'ABSPATH' ) || exit;

class CampaignHooks implements HookProvider {
    public static function get()
    {
        return [
            CampaignAfterSaveAction::class,
            CampaignAfterPermanentDeleteAction::class,
            UpdateValidationRuleFilter::class,
            CampaignCompletedAction::class,
        ];
    }
}
