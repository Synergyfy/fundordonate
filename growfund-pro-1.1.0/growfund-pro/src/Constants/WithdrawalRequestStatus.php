<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class WithdrawalRequestStatus
{
    use HasConstants;

    const PENDING = 'pending';
    const APPROVED = 'approved';
    const REJECTED = 'rejected';
}
