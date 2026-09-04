<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\CampaignStatusUpdateEvent;
use GrowfundPro\Mails\Admin\NewCampaignSubmittedForReviewMail;
use GrowfundPro\Mails\Fundraiser\CampaignApprovedMail;
use GrowfundPro\Mails\Fundraiser\CampaignDeclinedMail;
use Growfund\Supports\AdminUser;


class CampaignStatusUpdateEmailListener
{
    public function handle(CampaignStatusUpdateEvent $event)
    {
        $old_status = $event->campaign->status;
        $new_status = $event->status;

        if ($event->is_submitted_for_review($old_status, $new_status)) {
            $this->send_submitted_for_review_mail($event);
            return;
        }

        if ($event->is_resubmitted_for_review($old_status, $new_status)) {
            $this->send_submitted_for_review_mail($event);
            return;
        }

        if ($event->is_declined($old_status, $new_status)) {
            $this->send_campaign_declined_mail_to_fundraisers($event);
            return;
        }

        if ($event->is_published($old_status, $new_status)) {
            $this->send_campaign_approved_mail_to_fundraisers($event);
            return;
        }
    }

    protected function send_submitted_for_review_mail(CampaignStatusUpdateEvent $event)
    {
        growfund_scheduler()->resolve(NewCampaignSubmittedForReviewMail::class)
            ->with([
                'campaign_id' => $event->campaign->id,
                'receiver_user_id' => AdminUser::get_id(),
            ])->schedule_email();
    }

    protected function send_campaign_approved_mail_to_fundraisers(CampaignStatusUpdateEvent $event)
    {
        $campaign_fundraiser = growfund_user($event->campaign->fundraiser->id);

        if (! $campaign_fundraiser->is_fundraiser()) {
            return;
        }

        growfund_scheduler()->resolve(CampaignApprovedMail::class)
            ->with([
                'campaign_id' => $event->campaign->id,
                'receiver_user_id' => $campaign_fundraiser->get_id(),
            ])
            ->schedule_email();
    }

    protected function send_campaign_declined_mail_to_fundraisers(CampaignStatusUpdateEvent $event)
    {
        $fundraiser = growfund_user($event->campaign->fundraiser->id);

        if ($fundraiser->is_fundraiser()) {
            growfund_scheduler()->resolve(CampaignDeclinedMail::class)
                ->with([
                    'campaign_id' => $event->campaign->id,
                ])
                ->schedule_email();
        }
    }
}
