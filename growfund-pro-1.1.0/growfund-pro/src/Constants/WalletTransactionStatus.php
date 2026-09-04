<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class WalletTransactionStatus
{
    use HasConstants;

    const PENDING = 'pending';
    const COMPLETED = 'completed';
}
