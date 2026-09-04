<?php

namespace GrowfundPro\Controllers\API;

defined( 'ABSPATH' ) || exit;

use Growfund\Contracts\Request;
use Growfund\Http\Response;
use GrowfundPro\Managers\LicenseManager;
use GrowfundPro\Services\LicenseService;

class LicenseController {
    protected $service;

    public function __construct(LicenseService $service)
    {
        $this->service = $service;
    }

    public function info() {
        $license_info = $this->service->get_license_info();
        
        return growfund_response()->json([
            'data' => $license_info,
            'message' => !empty($license_info) ? 'License info fetched successfully' : 'License info not found',
        ]);
    }
    
    public function update(Request $request) {
        $is_updated = $this->service->update_growfund_pro_license($request->get_string('license_key'));

        return growfund_response()->json([
            'data' => $is_updated,
            'message' => $is_updated ? 'License updated successfully' : 'Failed to update the license, please check your license key.',
        ], $is_updated ? Response::OK : Response::INTERNAL_SERVER_ERROR);
    }

    public function delete(Request $request) {
        $license_manager = LicenseManager::getInstance();
        $is_deleted = $license_manager->delete_growfund_pro_license($request->get_string('license_key'));

        return growfund_response()->json([
            'data' => $is_deleted,
            'message' => $is_deleted ? 'License deleted successfully' : 'Failed to delete the license',
        ], $is_deleted ? Response::NO_CONTENT : Response::NOT_FOUND);
    }

    public function check_authorization(Request $request) {
        $redirection_url = $this->service->growfund_pro_oauth_check($request->get_string('license_key'));
        return growfund_response()->json([
            'data' => $redirection_url,
            'message' => !empty($redirection_url) ? 'License authentication successful' : 'License authentication failed',
        ], !empty($redirection_url) ? Response::OK : Response::UNAUTHORIZED);
    }
}
