<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Growfund\Http\Response;
use Growfund\Supports\Date;
use GrowfundPro\License;
use GrowfundPro\Managers\LicenseManager;

class LicenseService {
    public function get_license_info() {
        $license_manager = LicenseManager::getInstance();
        $license_info = $license_manager->get_license_info();

        return [
            'activated' => (bool) ($license_info['activated'] ?? false),
            'activated_at' => !empty($license_info['activated_at']) ? Date::format($license_info['activated_at']) : null,
            'customer_name' => $license_info['customer_name'] ?? '',
            'expires_at' => !empty($license_info['expires_at']) ? Date::format($license_info['expires_at']) : null,
            'is_expired' => (bool) ($license_info['is_expired'] ?? false),
            'license_key' => $license_info['license_key'] ?? '',
            'license_type' => $license_info['license_type'] ?? ''
        ];
    }

    public function growfund_pro_oauth_check(string $license_key) {
        $license_manager = LicenseManager::getInstance();
        $site_url = get_site_url();
        $params = [
            'body' => [
                'license_key'  => $license_key,
                'website_url' => $site_url,
                'redirect_url' => admin_url(sprintf("?page=growfund&plugin=%s#/settings/license", License::PRODUCT_SLUG)),
            ],
            'headers' => $license_manager->get_api_header(),
        ];

        $is_authorize_response = wp_remote_post(
            License::get_platform_api_endpoint() . 'oauth/authorize',
            $params
        );
				
		if (is_wp_error($is_authorize_response)) { 
			return [];
		}

        $is_authorize_response_body = $is_authorize_response['body'];
        
        $response = json_decode($is_authorize_response_body, true);

        if ($response['status'] !== Response::OK) {
            return [];
        }

        return [
            'redirection_url' => $response['body_response']
        ];
	}

    public function update_growfund_pro_license(string $license_key) {
        $license_manager = LicenseManager::getInstance();

		if (!$license_manager->has_license()) {
			return false;
		}

        $license = $license_manager->get_license_info();

        $license['license_key'] = $license_key;
		$verify = $license_manager->verify_license($license);

		return $verify;
	}
}
