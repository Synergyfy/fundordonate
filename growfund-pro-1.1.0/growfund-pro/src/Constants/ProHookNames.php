<?php

namespace GrowfundPro\Constants;

defined( 'ABSPATH' ) || exit;

class ProHookNames
{
    const INIT = 'init';
    const ADMIN_INIT = 'admin_init';
    const ADMIN_ENQUEUE_SCRIPT = 'admin_enqueue_scripts';
    const WP_ENQUEUE_SCRIPT = 'wp_enqueue_scripts';
    const WP_AUTHENTICATE_USER = 'wp_authenticate_user';
    const WP_USER_REGISTER = 'user_register';

    // Plugin Updater hooks
    const PLUGINS_API = 'plugins_api';
    const UPGRADER_PRE_DOWNLOAD = 'upgrader_pre_download';

    // Growfund Hooks
    /** @deprecated since 1.0.2 */
    const GROWFUND_FILTER_PRO_FEATURES = 'growfund/features'; // @todo: deprecated since 1.0.2. keep it just because of backward compatibility - will be removed in 1.1.0.
    const GROWFUND_ROUTE_BEFORE_INIT_ACTION = 'growfund/route/before_init';
    const GROWFUND_CAMPAIGN_AFTER_SAVE_ACTION = 'growfund/campaign/after_save';
    const GROWFUND_CAMPAIGN_PUBLISHED = 'growfund/campaign/published';
    const GROWFUND_CAMPAIGN_COMPLETED = 'growfund/campaign/completed';
    const GROWFUND_CAMPAIGN_AFTER_PERMANENT_DELETE_ACTION = 'growfund/campaign/after_permanent_delete';
    const GROWFUND_CAMPAIGN_UPDATE_VALIDATION_RULES_FILTER = 'growfund/campaign/update_validation_rules';
    const GROWFUND_REWARD_VALIDATION_RULES_FILTER = 'growfund/reward/validation_rules';
    const GROWFUND_BACKER_OVERVIEW_FILTER = 'growfund/backer/overview';
    const GROWFUND_DONOR_OVERVIEW_FILTER = 'growfund/donor/overview';
    const GROWFUND_BEFORE_REGISTER_SITE_ROUTES_ACTION = 'growfund/route/before_register_site_routes';
    const GROWFUND_APP_PAYMENT_CONFIG_FILTER = 'growfund/app_payment_config';
    const GROWFUND_BEFORE_APP_CONFIG_UPDATE_FILTER = 'growfund/app_config/before_update';
    const GROWFUND_BEFORE_OPTION_UPDATE_FILTER = 'growfund/option/before_update';
    const GROWFUND_ALLOW_CAMPAIGN_COMMENTS_FILTER = 'growfund/campaign/allow-comments';
    const GROWFUND_ALLOW_CAMPAIGN_TRIBUTE_FILTER = 'growfund/campaign/allow-tribute';
    const GROWFUND_ALLOW_CAMPAIGN_FUND_FILTER = 'growfund/campaign/allow-fund';
    const GROWFUND_ALLOW_ANONYMOUS_CONTRIBUTION_FILTER = 'growfund/permission/allow-anonymous-contribution';
    const GROWFUND_ALLOW_CONTRIBUTOR_COMMENTS_FILTER = 'growfund/permission/allow-contributor-comments';
    const GROWFUND_FUNDRAISER_CAMPAIGN_DELETION_FILTER = 'growfund/permission/fundraiser-can-delete-campaign';
    const GROWFUND_FUNDRAISER_CAMPAIGN_PUBLISH_FILTER = 'growfund/permission/fundraiser-can-publish-campaign';
    const GROWFUND_ALLOW_GUEST_CHECKOUT_FILTER = 'growfund/payment/allow-guest-checkout';
    const GROWFUND_ALLOW_EMAIL_VERIFICATION = 'growfund/enable_email_verification';
    const GROWFUND_COLLABORATOR_LIST_FILTER = 'growfund/collaborator/list';
    const GROWFUND_COLLABORATOR_CAMPAIGN_IDS_FILTER = 'growfund/collaborator/campaign-ids';
    const GROWFUND_FUNDRAISER_CAMPAIGN_IDS_QUERY_FILTER = 'growfund/fundraiser/campaign-ids-query';
    const GROWFUND_FUND_LIST_FILTER = 'growfund/fund/list';
    const GROWFUND_CURRENT_USER_FILTER = 'growfund/current_user';
    const GROWFUND_PLEDGE_AFTER_BACKED_ACTION = 'growfund/pledge/after_backed';
    const GROWFUND_DONATION_AFTER_COMPLETED_ACTION = 'growfund/donation/after_completed';
    const GROWFUND_WALLET_TRANSACTION_SYNC_ACTION = 'growfund/wallet/transactions/sync';
}
