<?php

namespace GrowfundPro\App\Listeners;

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\PledgeStatusUpdateEvent;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Mails\RewardDeliveredMail;
use GrowfundPro\Mails\Fundraiser\PledgeAmountChargedMail;
use Growfund\Mails\PledgeCancelledMail;
use Growfund\Supports\Date;
use GrowfundPro\Services\FundraiserService;

class PledgeStatusUpdateEmailListener
{
    public function handle(PledgeStatusUpdateEvent $event)
    {
        $old_status = $event->pledge->status;
        $new_status = $event->status;

        if ($event->is_cancelled($old_status, $new_status)) {
            return $this->send_pledge_cancelled_mail_to_fundraisers($event);
        }

        if ($event->is_backed($old_status, $new_status)) {
            return $this->send_pledge_amount_charged_mail_to_fundraisers($event);
        }

        if ($event->is_completed($old_status, $new_status) && !empty($event->pledge->reward)) {
            $this->send_reward_delivered_mail($event);
        }
    }

    protected function send_reward_delivered_mail(PledgeStatusUpdateEvent $event)
    {
        $reward_delivered_date = Date::current_sql_safe();

        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->pledge->campaign->id,
            (int) $event->pledge->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(RewardDeliveredMail::class)
                ->with([
                    'pledge_id' => $event->pledge->id,
                    'receiver_user_id' => $fundraiser->id,
                    'reward_delivered_date' => $reward_delivered_date,
                    'content_key' => MailKeys::FUNDRAISER_REWARD_DELIVERED
                ])
                ->group('growfund_reward_delivered_mails')
                ->schedule_email();
        }
    }

    protected function send_pledge_amount_charged_mail_to_fundraisers(PledgeStatusUpdateEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->pledge->campaign->id,
            (int) $event->pledge->campaign->fundraiser->id
        );

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(PledgeAmountChargedMail::class)
                ->with([
                    'pledge_id' => $event->pledge->id,
                    'receiver_user_id' => $fundraiser->id
                ])
                ->group('growfund_pledge_amount_charged_mails')
                ->schedule_email();
        }
    }

    protected function send_pledge_cancelled_mail_to_fundraisers(PledgeStatusUpdateEvent $event)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail(
            (int) $event->pledge->campaign->id,
            (int) $event->pledge->campaign->fundraiser->id
        );

        $pledge_cancelled_date = Date::current_sql_safe();

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()->resolve(PledgeCancelledMail::class)
                ->with([
                    'content_key' => MailKeys::FUNDRAISER_PLEDGE_CANCELLED,
                    'pledge_id' => $event->pledge->id,
                    'receiver_user_id' => $fundraiser->id,
                    'pledge_cancelled_date' => $pledge_cancelled_date,
                ])
                ->group('growfund_pledge_cancelled_mails')
                ->schedule_email();
        }
    }
}
