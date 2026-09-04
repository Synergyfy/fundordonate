<?php

namespace GrowfundPro\Services;

use Growfund\Constants\Tables;
use Growfund\QueryBuilder;
use Growfund\Supports\Date;
use GrowfundPro\Constants\WalletReferenceType;
use GrowfundPro\Constants\WalletTransactionAction;
use GrowfundPro\Constants\WalletTransactionStatus;
use GrowfundPro\Constants\WalletTransactionType;
use GrowfundPro\DTO\Wallet\WalletTransactionDTO;
use GrowfundPro\Supports\Campaign;

defined( 'ABSPATH' ) || exit;

class WalletTransactionService {
    /** @var WalletService */
    protected $wallet_service;

    public function __construct()
    {
        $this->wallet_service = new WalletService();
    }

    public function store(WalletTransactionDTO $dto) {
        $dto->created_at = Date::current_sql_safe();

        $transaction_id = QueryBuilder::query()
            ->table(Tables::WALLET_TRANSACTIONS)
            ->create($dto->exclude(['id'])->to_array());

        if (empty($transaction_id)) {
            return false;
        }

        return (int) $transaction_id;
    }

    public function mark_campaign_earnings_ready_for_withdraw(int $campaign_id, int $fundraiser_id) {
        $is_updated = QueryBuilder::query()->table(Tables::WALLET_TRANSACTIONS)
            ->where_raw(
                sprintf(
                    'wallet_id IN (SELECT id FROM %s WHERE user_id = :fundraiser_id)', 
                    QueryBuilder::prefix(Tables::WALLETS)
                ), 
                ['fundraiser_id' => $fundraiser_id]
            )
            ->where('campaign_id', $campaign_id)
            ->where('type', WalletTransactionType::EARNING)
            ->where('status', WalletTransactionStatus::PENDING)
            ->update([
                'status' => WalletTransactionStatus::COMPLETED
            ]);

        return !empty($is_updated);
    }

    public function calculate_campaign_platform_fee(int $campaign_id, int $fundraiser_id) {
        if (!Campaign::is_enabled_platform_fee($campaign_id)) {
            return false;
        }
        
        $wallet = $this->wallet_service->get_by_fundraiser_id($fundraiser_id);

        if (empty($wallet)) {
            return false;
        }

        $total_earnings = QueryBuilder::query()
            ->table(Tables::WALLET_TRANSACTIONS)
            ->where('wallet_id', $wallet->id)
            ->where('campaign_id', $campaign_id)
            ->where('type', WalletTransactionType::EARNING)
            ->where('status', WalletTransactionStatus::COMPLETED)
            ->where('action', WalletTransactionAction::DEBIT)
            ->group_by('campaign_id')
            ->sum('amount');

        $platform_fee = Campaign::calculate_platform_fee($campaign_id, (int) $total_earnings);

        $platform_fee_transaction = $this->get_campaign_platform_fee_transaction($campaign_id);

        if (!empty($platform_fee_transaction)) {
            $is_updated = QueryBuilder::query()
                ->table(Tables::WALLET_TRANSACTIONS)
                ->where('campaign_id', $campaign_id)
                ->where('type', WalletTransactionType::PLATFORM_FEE)
                ->update([
                    'amount' => $platform_fee,
                    'created_at' => Date::current_sql_safe()
                ]);

            return !empty($is_updated);
        }

        $dto = new WalletTransactionDTO();
        $dto->wallet_id = $wallet->id;
        $dto->campaign_id = $campaign_id;
        $dto->reference_id = null;
        $dto->reference_type = null;
        $dto->action = WalletTransactionAction::CREDIT;
        $dto->type = WalletTransactionType::PLATFORM_FEE;
        $dto->amount = $platform_fee;
        $dto->status = WalletTransactionStatus::COMPLETED;
        
        $transaction_id = $this->store($dto);

        return !empty($transaction_id);
    }

    public function get_campaign_platform_fee_transaction(int $campaign_id) {
        $record = QueryBuilder::query()
            ->table(Tables::WALLET_TRANSACTIONS)
            ->where('campaign_id', $campaign_id)
            ->where('type', WalletTransactionType::PLATFORM_FEE)
            ->first();

        if (empty($record)) {
            return null;
        }

        return $this->prepare_transaction_dto($record);
    }

    public function get_withdrawal_transaction(int $fundraiser_id, int $withdrawal_request_id) {
        $record = QueryBuilder::query()
            ->table(Tables::WALLET_TRANSACTIONS)
            ->where_raw(
                sprintf(
                    'wallet_id IN (SELECT id FROM %s WHERE user_id = :fundraiser_id)', 
                    QueryBuilder::prefix(Tables::WALLETS)
                ), 
                ['fundraiser_id' => $fundraiser_id]
            )
            ->where('type', WalletTransactionType::WITHDRAWAL_REQUEST)
            ->where('reference_id', $withdrawal_request_id)
            ->where('reference_type', WalletReferenceType::WITHDRAWAL_REQUEST)
            ->first();

        if (empty($record)) {
            return null;
        }

        return $this->prepare_transaction_dto($record);
    }

    protected function prepare_transaction_dto($record) {
        $dto = new WalletTransactionDTO();
        $dto->id = $record->ID;
        $dto->wallet_id = $record->wallet_id;
        $dto->campaign_id = $record->campaign_id;
        $dto->reference_id = $record->reference_id;
        $dto->reference_type = $record->reference_type;
        $dto->type = $record->type;
        $dto->amount = $record->amount;
        $dto->status = $record->status;
        $dto->created_at = $record->created_at;

        return $dto;
    }

    public function update_status(int $wallet_transaction_id, string $status) {
        $is_updated = QueryBuilder::query()
            ->table(Tables::WALLET_TRANSACTIONS)
            ->where('ID', $wallet_transaction_id)
            ->update([
                'status' => $status
            ]);

        return !empty($is_updated);
    }
}
