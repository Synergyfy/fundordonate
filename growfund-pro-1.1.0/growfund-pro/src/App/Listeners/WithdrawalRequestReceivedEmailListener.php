<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\App\Events\WithdrawalRequestReceivedEvent;
use GrowfundPro\Mails\Admin\WithdrawalRequestReceivedMail;

class WithdrawalRequestReceivedEmailListener
{
    public function handle(WithdrawalRequestReceivedEvent $event)
    {
        growfund_scheduler()->resolve(WithdrawalRequestReceivedMail::class)
            ->with([
                'withdrawal_request_id' => $event->withdrawal_request->id,
            ])
            ->group('growfund_withdrawal_request_mails')
            ->schedule_email();
    }
}
