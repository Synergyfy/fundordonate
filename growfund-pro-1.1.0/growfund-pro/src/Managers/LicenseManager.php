<?php

namespace GrowfundPro\Managers;

defined( 'ABSPATH' ) || exit;

use Growfund\Http\Response;
use Growfund\Supports\Date;
use Growfund\Supports\Option;
use GrowfundPro\License;

class LicenseManager
{
    public static $instance = null;

    protected $themeum_response_data = null;

    protected $license_info = null;

    /**
     * @return static
     */
    public static function getInstance()
    {
        if (is_null(static::$instance)) {
            static::$instance = new static();
        }

        return static::$instance;
    }

    public function get_api_header(string $token = '') {
		if ( ! empty( $token ) ) {
			return [
                'Authorization' => 'Bearer ' . $token,
            ];
		}

        return [
			'Secret-Key' => License::SECRET_KEY,
		];
	}

    public function get_license_settings_page_url() {
        return admin_url('admin.php?page=growfund#/settings/license');
    }

    public function get_license_info() {
        if (!empty($this->license_info) && is_array($this->license_info)) {
            return $this->license_info;
        }

        $license_info = Option::get(License::OPTION_KEY, null);

        if (is_string($license_info)) {
            $license_info = maybe_unserialize($license_info);
        }

        if (!is_array($license_info)) {
            $license_info = null;
        }

        $license_info['is_expired'] = false;

        if (isset($license_info['expires_at'])) {
            $license_info['is_expired'] = is_null($license_info['expires_at']) || Date::is_date_in_past(Date::format($license_info['expires_at']));
        }
            
        $this->license_info = $license_info;

        return $this->license_info;
    }

    public function has_license() {
        return !empty($this->get_license_info());
    }

    public function check_for_update() {
		if (!empty($this->themeum_response_data)) {
			// Use runtime cache.
			return $this->themeum_response_data;
		}

        $license_info  = $this->get_license_info();


        $license_key   = $license_info['license_key'] ?? '';
        $access_token  = $license_info['access_token'] ?? '';
        $site_url = get_site_url();

		$end_point = !empty($access_token) ? 'plugin-update-status' : 'check-update';

        $params = [
            'body' => [
                'license_key'  => $license_key,
                'product_slug' => License::PRODUCT_SLUG,
                'website_url'  => $site_url
            ],
            'headers' => $this->get_api_header($access_token)
        ];

        // Make the POST request.
        $request = wp_remote_post(License::get_platform_api_endpoint() . $end_point, $params);

        $response_data = [];
        
        // Check if response is valid.
        if (!is_wp_error($request) || wp_remote_retrieve_response_code($request) === Response::OK) {
            $response_data = json_decode($request['body'], true);
        }

        $this->themeum_response_data = $response_data;
        
        return $this->themeum_response_data;
	}

    public function update_growfund_pro_license(array $license_options_data) {
		$is_updated = Option::update(License::OPTION_KEY, $license_options_data );

        if ($is_updated !== false) {
            delete_transient(License::TRANSIENT_KEY);
            set_transient(License::TRANSIENT_KEY, $license_options_data, License::get_transient_expiration_time());
        }

        return $is_updated;
    }

    public function delete_growfund_pro_license() {
		$license_deleted = Option::delete(License::OPTION_KEY);
        
		if ($license_deleted) {
			delete_transient(License::TRANSIENT_KEY);

			return true;
		}

        return false;
	}

    public function verify_license(array $license) {
		$site_url = get_site_url();
        $response = wp_remote_post(
            License::get_platform_api_endpoint() . (!empty($license['access_token']) ? 'verify-license' : 'check-license'),
            [
                'body' => [
                    'license_key' => $license['license_key'] ?? '',
                    'website_url' => $site_url,
                ],
                'headers' => $this->get_api_header($license['access_token'] ?? '')
            ]
        );

        if (is_wp_error( $response)) {
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);

		$response_body = $response['body'];
        $response = json_decode($response_body, true);
        
		if ($status_code === Response::OK) {
			$license_options_data = $this->get_license_info();

			$license_options_data['activated'] = true;
            $license_options_data['customer_name'] = $response['body_response']['customer_name'];
            $license_options_data['expires_at'] = $response['body_response']['expires_at'];
            $license_options_data['activated_at'] = $response['body_response']['activated_at'];
            $license_options_data['license_type'] = $response['body_response']['license_type'];

            Option::set(License::VERIFICATION_ATTEMPT_KEY, 0);

            return $this->update_growfund_pro_license( $license_options_data );
		}
        
        if ($status_code === Response::UNAUTHORIZED) {
			if (isset($response['code']) && $response['code'] === 'expired_token') {
				$oauth_response = wp_remote_post(
					License::get_platform_api_endpoint() . 'oauth/tokens',
					[
						'body'    => [
							"grant_type" => "refresh",
							"token" => $license['refresh_token']
						],
						'headers' => $this->get_api_header()
					]
				);
				$response_body = $oauth_response['body'];
				$response = json_decode($response_body, true);

				if ($response['status'] === Response::OK) {
					$license_options_data = $this->get_license_info();
                    $license_options_data['activated'] = true;
                    $license_options_data['access_token'] = $response['body_response']['access_token'];
                    $license_options_data['refresh_token'] = $response['body_response']['refresh_token'];
                    $license_options_data['tokens_expires_at'] = $response['body_response']['tokens_expires_at'];

                    Option::set(License::VERIFICATION_ATTEMPT_KEY, 0);

					return $this->update_growfund_pro_license($license_options_data);
				}
			}

			if (isset($response['code']) && $response['code'] === 'invalid_token') { 
                $attempt = Option::get(License::VERIFICATION_ATTEMPT_KEY, 0);

                if ($attempt >= License::MAX_VERIFICATION_ATTEMPT) {
                    $license_options_data = $this->get_license_info();
					$license_options_data['activated'] = false;

					$this->update_growfund_pro_license($license_options_data);

                    Option::set(License::VERIFICATION_ATTEMPT_KEY, 0);

                    return false;
                }

                Option::set(License::VERIFICATION_ATTEMPT_KEY, $attempt + 1);
			}
		}

		return false;
	}
}
