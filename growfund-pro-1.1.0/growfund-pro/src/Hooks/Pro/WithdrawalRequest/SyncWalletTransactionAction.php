<?php

namespace GrowfundPro\Hooks\Pro\WithdrawalRequest;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\OptionKeys;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\Option;
use GrowfundPro\Services\WalletTransactionSyncService;

class SyncWalletTransactionAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_WALLET_TRANSACTION_SYNC_ACTION;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $is_sync_enabled = $args[0] ?? false;

        if (!$is_sync_enabled) {
            return;
        }

        $is_synced_wallet_transaction = boolval(Option::get(OptionKeys::IS_SYNCED_WALLET_TRANSACTION, false));

        if ($is_synced_wallet_transaction) {
            return;
        }

        $wallet_transaction_sync_service = new WalletTransactionSyncService();

        $wallet_transaction_sync_service->sync();

        Option::update(OptionKeys::IS_SYNCED_WALLET_TRANSACTION, true);
    }
}
