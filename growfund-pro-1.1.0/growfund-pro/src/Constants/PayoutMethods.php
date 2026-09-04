<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class PayoutMethods
{
    use HasConstants;
    
    const PAYPAL = 'paypal';
    const BANK = 'bank';
    const OTHER = 'others';
}
