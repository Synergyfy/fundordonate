<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\App\Events\WithdrawalRequestRejectedEvent;
use GrowfundPro\Mails\Fundraiser\WithdrawalRequestRejectedMail;

class WithdrawalRequestRejectedEmailListener
{
    public function handle(WithdrawalRequestRejectedEvent $event)
    {
        growfund_scheduler()->resolve(WithdrawalRequestRejectedMail::class)
            ->with([
                'withdrawal_request_id' => $event->withdrawal_request->id,
            ])
            ->group('growfund_withdrawal_request_mails')
            ->schedule_email();
    }
}
