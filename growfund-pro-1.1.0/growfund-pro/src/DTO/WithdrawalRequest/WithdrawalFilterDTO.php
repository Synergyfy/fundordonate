<?php

namespace GrowfundPro\DTO\WithdrawalRequest;

defined( 'ABSPATH' ) || exit;

use Growfund\DTO\DTO;

class WithdrawalFilterDTO extends DTO
{
    /** @var int */
    public $user_id;

    /** @var string */
    public $method;

    /** @var string */
    public $search;

    /** @var string */
    public $status;

    /** @var int */
    public $page;

    /** @var int */
    public $limit;

    /** @var string */
    public $orderby;

    /** @var string */
    public $order;

    /** @var string */
    public $start_date;

    /** @var string */
    public $end_date;
}
