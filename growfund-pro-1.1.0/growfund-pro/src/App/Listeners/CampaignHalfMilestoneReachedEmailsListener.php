<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\CampaignHalfMilestoneReachedEvent;
use GrowfundPro\Schedules\CampaignHalfMilestoneReachedSchedule;

class CampaignHalfMilestoneReachedEmailsListener
{
    public function handle(CampaignHalfMilestoneReachedEvent $event)
    {
        growfund_scheduler()->resolve(CampaignHalfMilestoneReachedSchedule::class)
            ->with(['campaign_id' => $event->campaign_id])->interval(2 * MINUTE_IN_SECONDS)
            ->group('growfund_campaign_half_milestone_reached_schedule')
            ->schedule_recurring();
    }
}
