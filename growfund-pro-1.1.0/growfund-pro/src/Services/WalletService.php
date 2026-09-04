<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Exception;
use Growfund\Constants\Tables;
use Growfund\QueryBuilder;
use Growfund\Services\DonationService;
use Growfund\Services\PledgeService;
use Growfund\Services\RewardService;
use Growfund\Supports\Date;
use GrowfundPro\Constants\WalletTransactionStatus;
use GrowfundPro\Constants\WalletTransactionType;
use GrowfundPro\DTO\Wallet\FundraiserWalletDTO;
use GrowfundPro\DTO\Wallet\WalletDTO;

class WalletService {
    /** @var CampaignService */
    protected $campaign_service;

    /** @var RewardService */
    protected $reward_service;

    /** @var DonationService */
    protected $donation_service;

    /** @var PledgeService */
    protected $pledge_service;

    public function __construct() {
        $this->campaign_service = new CampaignService();
        $this->reward_service = new RewardService();
        $this->donation_service = new DonationService();
        $this->pledge_service = new PledgeService();
    }

    public function re_calculate_wallet(int $fundraiser_id) 
    {
        $result = QueryBuilder::query()
            ->table(Tables::WALLET_TRANSACTIONS)
            ->select([
                sprintf("SUM(CASE WHEN type = '%s' AND status = '%s' THEN amount ELSE 0 END) as total_earned", WalletTransactionType::EARNING, WalletTransactionStatus::COMPLETED),
                sprintf("SUM(CASE WHEN type = '%s' THEN amount ELSE 0 END) as total_withdrawn", WalletTransactionType::WITHDRAWAL_APPROVAL),
                sprintf("SUM(CASE WHEN type = '%s' THEN amount ELSE 0 END) as platform_fees", WalletTransactionType::PLATFORM_FEE),
                sprintf("SUM(CASE WHEN type = '%s' AND status = '%s' THEN amount ELSE 0 END) as pending_withdrawals", WalletTransactionType::WITHDRAWAL_REQUEST, WalletTransactionStatus::PENDING)
            ])
            ->where_raw(
                sprintf(
                    'wallet_id IN (SELECT id FROM %s WHERE user_id = :fundraiser_id)',
                    QueryBuilder::prefix(Tables::WALLETS)
                ), 
                ['fundraiser_id' => $fundraiser_id]
            )
            ->first();

        $current_balance = $result->total_earned - $result->total_withdrawn - $result->platform_fees;

        $is_recalculated = QueryBuilder::query()
            ->table(Tables::WALLETS)
            ->where('user_id', $fundraiser_id)
            ->update([
                'balance' => $current_balance,
                'requested_amount' => $result->pending_withdrawals,
                'withdraw_amount' => $result->total_withdrawn,
                'platform_fee' => $result->platform_fees,
                'updated_at' => Date::current_sql_safe()
            ]);

        return !empty($is_recalculated);
    }

    public function first_or_create(int $fundraiser_id) {
        $wallet = $this->get_by_fundraiser_id($fundraiser_id);

        if (!empty($wallet)) {
            return $wallet;
        }

        return $this->create($fundraiser_id);
    }

    protected function create(int $fundraiser_id) {
        $wallet = new WalletDTO();
        $wallet->user_id = $fundraiser_id;
        $wallet->balance = 0;
        $wallet->requested_amount = 0;
        $wallet->withdraw_amount = 0;
        $wallet->platform_fee = 0;
        $wallet->updated_at = Date::current_sql_safe();

        $wallet_id = QueryBuilder::query()->table(Tables::WALLETS)->create($wallet->exclude(['id'])->to_array());

        if (empty($wallet_id)) {
            throw new Exception(esc_html__('Failed to create wallet', 'growfund-pro'));
        }

        $wallet->id = $wallet_id;

        return $wallet;
    }

    public function get_by_fundraiser_id(int $fundraiser_id) {
        $wallet = QueryBuilder::query()->table(Tables::WALLETS)
            ->where('user_id', $fundraiser_id)
            ->first();

        if (empty($wallet)) {
            return null;
        }

        return $this->prepare_wallet_dto($wallet);
    }

    /**
     * @param object $record
     * 
     * @return WalletDTO
     */
    protected function prepare_wallet_dto($record) {
        $dto = new WalletDTO();
        $dto->id = $record->ID;
        $dto->user_id = $record->user_id;
        $dto->balance = $record->balance;
        $dto->requested_amount = $record->requested_amount;
        $dto->withdraw_amount = $record->withdraw_amount;
        $dto->platform_fee = $record->platform_fee;
        $dto->updated_at = $record->updated_at;

        return $dto;
    }

    public function get_fundraiser_wallet_info(int $fundraiser_id, bool $create_wallet_if_not_exist = false) {
        $wallet = $this->get_by_fundraiser_id($fundraiser_id);

        if (empty($wallet)) {
            if (!$create_wallet_if_not_exist) {
                return null;
            }

            $wallet = $this->create($fundraiser_id);
        }
        
        $dto = new FundraiserWalletDTO();

        $available_withdraw_amount = $wallet->balance - $wallet->requested_amount;

        $dto->available_withdraw_amount = $available_withdraw_amount > 0 ? $available_withdraw_amount : 0;
        $dto->net_balance = $wallet->balance;
        $dto->pending_amount = $wallet->requested_amount;
        $dto->total_withdrawal_amount = $wallet->withdraw_amount;

        return $dto;
    }
}
