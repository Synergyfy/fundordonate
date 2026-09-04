<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class WalletTransactionAction
{
    use HasConstants;
    
    const CREDIT = 'credit';
    const DEBIT = 'debit';
}
