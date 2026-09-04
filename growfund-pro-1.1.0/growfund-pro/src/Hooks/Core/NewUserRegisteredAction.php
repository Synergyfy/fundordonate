<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Hooks\BaseHook;
use Growfund\Mails\NewUserMail;
use Growfund\Supports\User as UserSupport;
use GrowfundPro\Services\FundraiserService;

class NewUserRegisteredAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::WP_USER_REGISTER;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $user_id = $args[0];

        $user = growfund_user($user_id);

        if (!$user->is_fundraiser() && !$user->is_donor() && !$user->is_backer()) {
            return;
        }

        if (UserSupport::is_guest($user_id)) {
            return;
        }

        $this->schedule_fundraiser_emails($user_id);
    }

    protected function schedule_fundraiser_emails($user_id)
    {
        $fundraisers = (new FundraiserService())->get_fundraisers_to_send_mail();

        foreach ($fundraisers as $fundraiser) {
            growfund_scheduler()
                ->resolve(NewUserMail::class)
                ->with([
                    'content_key' => MailKeys::FUNDRAISER_NEW_USER_REGISTRATION,
                    'user_id' => $user_id,
                    'receiver_user_id' => $fundraiser->id,
                ])
                ->group('growfund_user_emails')
                ->schedule_email();
        }
    }
}
