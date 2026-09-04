<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\PledgeCreatedEvent;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Mails\NewOfflinePledgeMail;
use Growfund\Mails\NewPledgeMail;
use GrowfundPro\Services\FundraiserService;

class PledgeCreatedEmailListener
{
    public function handle(PledgeCreatedEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->campaign->id,
            (int) $event->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(
                $event->create_pledge_dto->is_manual
                    ? NewOfflinePledgeMail::class
                    : NewPledgeMail::class
            )
                ->with([
                    'content_key' => $event->create_pledge_dto->is_manual
                        ? MailKeys::FUNDRAISER_NEW_OFFLINE_PLEDGE
                        : MailKeys::FUNDRAISER_NEW_PLEDGE,
                    'pledge_id' => $event->pledge_id,
                    'receiver_user_id' => $fundraiser->id,
                ])
                ->group('growfund_new_pledge_mails')
                ->schedule_email();
        }
    }
}
