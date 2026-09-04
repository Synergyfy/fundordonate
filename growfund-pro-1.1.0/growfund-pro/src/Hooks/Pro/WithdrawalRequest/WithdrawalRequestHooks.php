<?php

namespace GrowfundPro\Hooks\Pro\WithdrawalRequest;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;

class WithdrawalRequestHooks implements HookProvider {
    public static function get()
    {
        return [
            SyncWalletTransactionAction::class,
        ];
    }
}
