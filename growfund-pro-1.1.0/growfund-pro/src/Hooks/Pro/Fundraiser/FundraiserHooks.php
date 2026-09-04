<?php

namespace GrowfundPro\Hooks\Pro\Fundraiser;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class FundraiserHooks implements HookProvider {
    public static function get()
    {
        return [
            CollaboratorListFilter::class,
            CollaboratorCampaignIdsFilter::class,
            CurrentUserFilter::class,
            FundraiserCampaignIdsQueryFilter::class,
        ];
    }
}
