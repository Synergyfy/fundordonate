<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\CampaignPostUpdateEvent;
use GrowfundPro\Mails\CampaignPostUpdateMail;
use GrowfundPro\Schedules\CampaignPostUpdateSchedule;
use Growfund\Supports\AdminUser;
use GrowfundPro\Services\FundraiserService;

class CampaignPostUpdateEmailListener
{
    public function handle(CampaignPostUpdateEvent $event)
    {
        growfund_scheduler()->resolve(CampaignPostUpdateMail::class)
            ->with([
                'campaign_id' => $event->campaign_id,
                'receiver_user_id' => AdminUser::get_id(),
            ])
            ->group('growfund_campaign_post_update_mails')
            ->schedule_email();

        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->campaign_id,
            get_post_field('post_author', (int) $event->campaign_id)
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(CampaignPostUpdateMail::class)
                ->with([
                    'campaign_id' => $event->campaign_id,
                    'receiver_user_id' => $fundraiser->id,
                ])
                ->group('growfund_campaign_post_update_mails')
                ->schedule_email();
        }

        growfund_scheduler()->resolve(CampaignPostUpdateSchedule::class)
            ->with(['campaign_id' => $event->campaign_id])->interval(2 * MINUTE_IN_SECONDS)
            ->group('growfund_campaign_post_update_schedule')
            ->schedule_recurring();
    }
}
