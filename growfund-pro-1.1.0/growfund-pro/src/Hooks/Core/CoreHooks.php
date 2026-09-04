<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class CoreHooks implements HookProvider {
    public static function get()
    {
        return [
            EnqueueProAdminScriptsAction::class,
            EnqueueProDashboardScriptsAction::class,
            FundraiserCapabilitiesAction::class,
            NewUserRegisteredAction::class,
            RegisterRestRoutesAction::class,
            RegisterSiteRoutesAction::class,
            BeforeAppConfigUpdateFilter::class,
            BeforeOptionUpdateFilter::class,
            CheckLicenseKeyAction::class,
            CheckPluginLicenseBeforeUpdateFilter::class,
            PluginsApiFilter::class,
            PluginUpdateMessageAction::class,
            SiteTransientUpdatePluginsFilter::class,
            RestrictUserFromLogin::class,
            EnqueueScriptsProSite::class,
            AppPaymentConfigFilter::class,
        ];
    }
}
