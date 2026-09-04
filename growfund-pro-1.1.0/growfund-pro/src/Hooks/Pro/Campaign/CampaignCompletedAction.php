<?php

namespace GrowfundPro\Hooks\Pro\Campaign;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\UserTypes\Admin;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Core\AppSettings;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\PostMeta;
use GrowfundPro\Services\WalletService;
use GrowfundPro\Services\WalletTransactionService;

class CampaignCompletedAction extends BaseHook{
	public function get_name()
    {
        return ProHookNames::GROWFUND_CAMPAIGN_COMPLETED;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        /** @var \Growfund\Models\Campaign */
        list($campaign) = $args;

        $campaign_id = (int) $campaign->id;
        $fundraiser_id = (int) $campaign->fundraiser->id ?? 0;

        if (empty($campaign_id) || empty($fundraiser_id)) {
            return;
        }

        PostMeta::add((int) $campaign->id, 'enabled_platform_fee', growfund_settings(AppSettings::PAYMENT)->is_enabled_platform_fee());
        PostMeta::add((int) $campaign->id, 'platform_fee', growfund_settings(AppSettings::PAYMENT)->get_platform_fee());
        PostMeta::add((int) $campaign->id, 'platform_fee_type', growfund_settings(AppSettings::PAYMENT)->get_platform_fee_type());

        $user = growfund_user($fundraiser_id);

        if ($user->has_active_role(Admin::ROLE) || !$user->has_active_role(Fundraiser::ROLE)) {
            return;
        }

        $transaction_service = new WalletTransactionService();

        $transaction_service->mark_campaign_earnings_ready_for_withdraw(
            $campaign_id, 
            $fundraiser_id
        );

        $transaction_service->calculate_campaign_platform_fee(
            $campaign_id, 
            $fundraiser_id
        );

        $wallet_service = new WalletService();

        $wallet_service->re_calculate_wallet($fundraiser_id);
    }
}
