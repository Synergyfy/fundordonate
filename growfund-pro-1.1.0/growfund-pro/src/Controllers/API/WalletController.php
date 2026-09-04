<?php

namespace GrowfundPro\Controllers\API;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Http\Response;
use Growfund\Exceptions\AuthorizationException;
use GrowfundPro\Services\WalletService;

/**
 * Class WalletController
 * @since 1.1.0
 */
class WalletController
{
    /**
     * @var WalletService
     */
    protected $service;

    public function __construct(WalletService $service)
    {
        $this->service = $service;
    }
    /**
     * Get wallet info
     * @return Response
     */
    public function get_info()
    {
        if (!growfund_user()->has_active_role(Fundraiser::ROLE)) {
            throw new AuthorizationException(esc_html__('You do not have permission for this action', 'growfund'));
        }

        $response = [
            'data' => $this->service->get_fundraiser_wallet_info(growfund_user()->get_id(), true),
        ];

        return growfund_response()->json($response, Response::CREATED);
    }
}
