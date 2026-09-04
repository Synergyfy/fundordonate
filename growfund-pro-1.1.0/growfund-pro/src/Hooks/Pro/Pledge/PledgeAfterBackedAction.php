<?php

namespace GrowfundPro\Hooks\Pro\Pledge;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\Status\CampaignStatus;
use Growfund\Constants\UserTypes\Admin;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\DTO\Pledge\PledgeDTO;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Constants\WalletReferenceType;
use GrowfundPro\Constants\WalletTransactionAction;
use GrowfundPro\Constants\WalletTransactionStatus;
use GrowfundPro\Constants\WalletTransactionType;
use GrowfundPro\DTO\Wallet\WalletTransactionDTO;
use GrowfundPro\Services\WalletService;
use GrowfundPro\Services\WalletTransactionService;

class PledgeAfterBackedAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_PLEDGE_AFTER_BACKED_ACTION;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        /**
         * @var PledgeDTO
         */
        $pledge = $args[0];

        $fundraiser_id = (int) $pledge->campaign->fundraiser->id ?? 0;
        $campaign_id = (int) $pledge->campaign->id ?? 0;

        if (empty($fundraiser_id) || empty($campaign_id)) {
            return;
        }

        $user = growfund_user($fundraiser_id);

        if ($user->has_active_role(Admin::ROLE) || !$user->has_active_role(Fundraiser::ROLE)) {
            return;
        }

        $wallet_service = new WalletService();

        $wallet = $wallet_service->first_or_create($fundraiser_id);

        $transaction_dto = new WalletTransactionDTO();
        $transaction_dto->wallet_id = $wallet->id;
        $transaction_dto->campaign_id = $campaign_id;
        $transaction_dto->reference_id = $pledge->id;
        $transaction_dto->reference_type = WalletReferenceType::PLEDGE;
        $transaction_dto->action = WalletTransactionAction::DEBIT;
        $transaction_dto->type = WalletTransactionType::EARNING;
        $transaction_dto->amount = $pledge->payment->get_raw_total_amount();
        $transaction_dto->status = $pledge->campaign->status === CampaignStatus::COMPLETED 
            ? WalletTransactionStatus::COMPLETED 
            : WalletTransactionStatus::PENDING;

        $wallet_transaction_service = new WalletTransactionService();
        $wallet_transaction_service->store($transaction_dto);

        if ($pledge->campaign->status === CampaignStatus::COMPLETED) {
            $wallet_transaction_service->calculate_campaign_platform_fee($campaign_id, $fundraiser_id);
            
            $wallet_service->re_calculate_wallet($fundraiser_id);
        }
    }
}
