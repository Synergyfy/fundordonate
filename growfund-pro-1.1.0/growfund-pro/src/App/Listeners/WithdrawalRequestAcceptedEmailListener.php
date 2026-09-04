<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\App\Events\WithdrawalRequestAcceptedEvent;
use GrowfundPro\Mails\Fundraiser\WithdrawalRequestAcceptedMail;

class WithdrawalRequestAcceptedEmailListener
{
    public function handle(WithdrawalRequestAcceptedEvent $event)
    {
        growfund_scheduler()->resolve(WithdrawalRequestAcceptedMail::class)
            ->with([
                'withdrawal_request_id' => $event->withdrawal_request->id,
            ])
            ->group('growfund_withdrawal_request_mails')
            ->schedule_email();
    }
}
