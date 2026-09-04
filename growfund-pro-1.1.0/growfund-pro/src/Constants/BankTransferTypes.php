<?php

namespace GrowfundPro\Constants;

use Growfund\Traits\HasConstants;

defined( 'ABSPATH' ) || exit;

class BankTransferTypes
{
    use HasConstants;
    
    const IBAN = 'iban';
    const USD = 'usd';
    const CAD = 'cad';
    const AUD = 'aud';
    const GBP = 'gbp';
    const BEFTN = 'beftn';
}
