<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\GoalReachedEvent;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Mails\CampaignFundedMail;
use GrowfundPro\Services\FundraiserService;

class GoalReachedEmailsListener
{
    public function handle(GoalReachedEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->campaign->id,
            (int) $event->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(CampaignFundedMail::class)
                ->with([
                    'content_key' => MailKeys::FUNDRAISER_CAMPAIGN_FUNDED,
                    'campaign_id' => (int) $event->campaign->id,
                    'receiver_user_id' => $fundraiser->id
                ])->schedule_email();
        }
    }
}
