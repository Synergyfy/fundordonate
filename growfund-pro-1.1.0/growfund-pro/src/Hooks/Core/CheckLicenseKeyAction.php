<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Http\Response;
use GrowfundPro\License;
use GrowfundPro\Managers\LicenseManager;

class CheckLicenseKeyAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::ADMIN_INIT;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $authorize_token = growfund_pro_input_get('authorize_token', '');
        $plugin = growfund_pro_input_get('plugin', '');

        if (!empty($authorize_token) && $plugin === License::PRODUCT_SLUG) {
            $license_manager = LicenseManager::getInstance();
            $redirect_url = $license_manager->get_license_settings_page_url();

			try {
				$response = wp_remote_post(
					License::get_platform_api_endpoint() . 'oauth/tokens',
					[
						'body'    => [
							"grant_type" => "authorize",
							"token" => $authorize_token
                        ],
						'headers' => $license_manager->get_api_header(),
                    ]
				);
				$license_info = [
					'access_token'      => '',
					'refresh_token'     => '',
					'tokens_expires_at' => '',
					'activated'         => false,
					'license_key'       => '',
					'customer_name'     => '',
					'expires_at'        => '',
					'activated_at'      => '',
					'license_type'      => '',
                ];

				if (is_wp_error($response)) {
					growfund_pro_flash_message('license-error', __('Something went wrong!!', 'growfund-pro'));
                    growfund_redirect( $redirect_url );   
				}

                $response_body = $response['body'];
				$response = json_decode($response_body, true);

				if ($response['status'] === Response::OK) {
					$license_info = array_combine(array_keys($license_info), array_values($response['body_response']));
                    
                    $license_manager->update_growfund_pro_license($license_info);

					growfund_redirect($redirect_url);
				}

				if ($response['status'] === Response::BAD_REQUEST) {
					growfund_pro_flash_message('license-error', __('Something went wrong!!', 'growfund-pro'));
					growfund_redirect($redirect_url);
				}
			} catch (\Throwable $throwable) {
                growfund_pro_flash_message('license-error', __('Something went wrong!!', 'growfund-pro'));
                growfund_redirect($redirect_url);
			}
		}
    }
}
