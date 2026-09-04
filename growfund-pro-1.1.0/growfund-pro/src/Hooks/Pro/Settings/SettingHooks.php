<?php

namespace GrowfundPro\Hooks\Pro\Settings;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;
use GrowfundPro\Hooks\Pro\Settings\CampaignSettings\AllowCommentsFilter;
use GrowfundPro\Hooks\Pro\Settings\CampaignSettings\AllowFundFilter;
use GrowfundPro\Hooks\Pro\Settings\CampaignSettings\AllowTributeFilter;
use GrowfundPro\Hooks\Pro\Settings\PaymentSettings\AllowGuestCheckoutFilter;
use GrowfundPro\Hooks\Pro\Settings\PermissionSettings\AllowAnonymousContributionFilter;
use GrowfundPro\Hooks\Pro\Settings\PermissionSettings\AllowContributorCommentsFilter;
use GrowfundPro\Hooks\Pro\Settings\PermissionSettings\FundraiserCampaignDeletionFilter;
use GrowfundPro\Hooks\Pro\Settings\PermissionSettings\FundraiserCampaignPublishFilter;
use GrowfundPro\Hooks\Pro\Settings\SecuritySettings\EnableEmailVerificationFilter;

class SettingHooks implements HookProvider {
    public static function get()
    {
        return [
            AllowFundFilter::class,
            AllowTributeFilter::class,
            AllowCommentsFilter::class,
            EnableEmailVerificationFilter::class,
            AllowAnonymousContributionFilter::class,
            AllowContributorCommentsFilter::class,
            FundraiserCampaignDeletionFilter::class,
            FundraiserCampaignPublishFilter::class,
            AllowGuestCheckoutFilter::class,
        ];
    }
}
