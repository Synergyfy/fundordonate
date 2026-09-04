<?php

namespace GrowfundPro\App\Events;

use GrowfundPro\DTO\WithdrawalRequest\WithdrawalRequestDTO;

defined( 'ABSPATH' ) || exit;

class WithdrawalRequestReceivedEvent {
    
    /** @var WithdrawalRequestDTO */
    public $withdrawal_request;

    public function __construct(WithdrawalRequestDTO $withdrawal_request)
    {
        $this->withdrawal_request = $withdrawal_request;
    }
}
