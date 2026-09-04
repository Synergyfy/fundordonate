<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\DonationCreatedEvent;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Mails\NewDonationMail;
use Growfund\Mails\NewOfflineDonationMail;
use GrowfundPro\Services\FundraiserService;

class DonationCreatedEmailListener
{
    public function handle(DonationCreatedEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->campaign->id,
            (int) $event->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(
                $event->donation_create_dto->is_manual
                    ? NewOfflineDonationMail::class
                    : NewDonationMail::class
            )
                ->with([
                    'content_key' => $event->donation_create_dto->is_manual
                        ? MailKeys::FUNDRAISER_NEW_OFFLINE_DONATION
                        : MailKeys::FUNDRAISER_NEW_DONATION,
                    'donation_id' => $event->donation_id,
                    'receiver_user_id' => $fundraiser->id
                ])
                ->group('growfund_new_donation_mails')
                ->schedule_email();
        }
    }
}
