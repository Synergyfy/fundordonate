<?php

namespace GrowfundPro\App\Providers;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\UserTypes\Collaborator;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Core\ServiceProvider;
use Growfund\Services\CampaignService;

class CampaignServiceProvider extends ServiceProvider
{
    /**
     * Register the fundraiser campaign ids to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('fundraiser_campaign_ids', function () {
            $current_user = growfund_user();

            if (!$current_user->has_active_role(Fundraiser::ROLE)) {
                return [];
            }

            $campaign_service = new CampaignService();
            $campaign_ids = $campaign_service->get_campaign_ids_by_fundraiser($current_user->get_id());

            return $campaign_ids;
        });

        $this->app->singleton('collaborator_campaign_ids', function () {
            $current_user = growfund_user();

            if (!$current_user->has_active_role(Collaborator::ROLE)) {
                return [];
            }

            $campaign_service = new CampaignService();
            $campaign_ids = $campaign_service->get_campaign_ids_by_collaborator($current_user->get_id());

            return $campaign_ids;
        });
    }
}
