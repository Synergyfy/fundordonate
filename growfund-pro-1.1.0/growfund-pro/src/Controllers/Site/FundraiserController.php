<?php

namespace GrowfundPro\Controllers\Site;

defined( 'ABSPATH' ) || exit;

use Exception;
use Growfund\Contracts\Request;
use Growfund\Http\Response;
use Growfund\Supports\FileHandler;
use Growfund\Views\Components\Auth\Signup;
use GrowfundPro\Services\FundraiserService;

class FundraiserController
{
    /** @var FundraiserService */
    protected $service;

    public function __construct(FundraiserService $service)
    {
        $this->service = $service;
    }

    public function show()
    {
        return growfund_renderer()->get_html('dashboard.app');
    }

    public function show_register_fundraiser()
    {
        $signup_page = new Signup();
        $signup_page->user_type = 'fundraiser';
        
        return growfund_get_html($signup_page);
    }

    public function download_bank_details_document(Request $request)
    {
        if (!growfund_user()->is_admin() && !growfund_user($request->get_int('id'))->is_fundraiser()) {
            throw new Exception(
                esc_html__('You do not have permission for this action', 'growfund-pro'), 
                (int) Response::UNAUTHORIZED
            );
        }
        $fundraiser = $this->service->get_by_id($request->get_int('id'));

        $payout_method = $this->service->get_payout_method((int) $fundraiser->id);

        if (empty($payout_method) || empty($payout_method->bank_details_document['file'] ?? '')) {
            throw new Exception(esc_html__('Document not found', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        (new FileHandler())->download(
            $payout_method->bank_details_document['file'], 
            $payout_method->bank_details_document['file_name'] ?? ''
        );
        exit;
    }
}
