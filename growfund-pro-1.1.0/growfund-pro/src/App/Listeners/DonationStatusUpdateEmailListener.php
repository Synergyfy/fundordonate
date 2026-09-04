<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\DonationStatusUpdateEvent;
use Growfund\Constants\Campaign\TributeNotificationType;
use GrowfundPro\Mails\Donor\TributeMail;
use GrowfundPro\Mails\Fundraiser\DonationAmountChargedMail;
use GrowfundPro\Mails\Fundraiser\DonationCancelledMail;
use GrowfundPro\Services\FundraiserService;

class DonationStatusUpdateEmailListener
{
    public function handle(DonationStatusUpdateEvent $event)
    {
        $old_status = $event->donation->status;
        $new_status = $event->status;

        if ($event->is_cancelled($old_status, $new_status)) {
            return $this->send_donation_cancelled_mail_to_fundraisers($event);
        }

        if ($event->is_completed($old_status, $new_status)) {
            $this->send_ecard_mail($event);
            return $this->send_donation_amount_charged_mail_to_fundraisers($event);
        }
    }

    protected function send_ecard_mail(DonationStatusUpdateEvent $event)
    {
        if (
            empty($event->donation->tribute_type)
            || empty($event->donation->tribute_notification_recipient_email)
            || !in_array(
                $event->donation->tribute_notification_type,
                [TributeNotificationType::ECARD, TributeNotificationType::BOTH],
                true
            )
        ) {
            return;
        }

        growfund_scheduler()->resolve(TributeMail::class)
            ->with([
                'donation_id' => $event->donation->id,
            ])
            ->group('growfund_donation_ecard_mails')
            ->schedule_email();
    }

    protected function send_donation_amount_charged_mail_to_fundraisers(DonationStatusUpdateEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->donation->campaign->id,
            (int) $event->donation->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(DonationAmountChargedMail::class)
                ->with([
                    'donation_id' => $event->donation->id,
                    'receiver_user_id' => $fundraiser->id,
                ])
                ->group('growfund_donation_amount_charged_mails')
                ->schedule_email();
        }
    }

    protected function send_donation_cancelled_mail_to_fundraisers(DonationStatusUpdateEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->donation->campaign->id,
            (int) $event->donation->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(DonationCancelledMail::class)
                ->with([
                    'pledge_id' => $event->donation->id,
                    'receiver_user_id' => $fundraiser->id,
                ])
                ->group('growfund_donation_cancelled_mails')
                ->schedule_email();
        }
    }
}
