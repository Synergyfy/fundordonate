<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class WalletReferenceType
{
    use HasConstants;
    
    const PLEDGE = 'pledge';
    const DONATION = 'donation';
    const WITHDRAWAL_REQUEST = 'withdrawal_request';
}
