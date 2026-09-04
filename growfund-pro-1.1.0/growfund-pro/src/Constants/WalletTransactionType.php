<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class WalletTransactionType
{
    use HasConstants;
    
    const EARNING = 'earning';
    const PLATFORM_FEE = 'platform_fee';
    const WITHDRAWAL_REQUEST = 'withdrawal_request';
    const WITHDRAWAL_APPROVAL = 'withdrawal_approval';
    const WITHDRAWAL_REJECTION = 'withdrawal_rejection';
}
