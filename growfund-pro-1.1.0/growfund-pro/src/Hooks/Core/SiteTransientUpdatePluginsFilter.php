<?php
namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Http\Response;
use GrowfundPro\License;
use GrowfundPro\Managers\LicenseManager;

class SiteTransientUpdatePluginsFilter extends BaseHook
{
    public function get_name()
    {
        return License::FORCE_UPDATE_CHECK 
            ? 'site_transient_update_plugins' 
            : 'pre_set_site_transient_update_plugins';
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $transient = $args[0] ?? null;

        if (!class_exists(LicenseManager::class)) {
            return $transient;
        }

        $base_name = GROWFUND_PRO_BASENAME;
        $license_manager = LicenseManager::getInstance();
		$response = $license_manager->check_for_update();

		if (
            isset($response['status']) 
            && $response['status'] === Response::OK 
            && version_compare(GROWFUND_PRO_VERSION, $response['body_response']['version'], '<')
            ) {
			$update_info = [
				'new_version' => $response['body_response']['version'],
				'package'     => $response['body_response']['download_url'],
				'tested'      => $response['body_response']['tested_wp_version'],
				'slug'        => $base_name,
				'url'         => $response['body_response']['download_url'],
			];
			$transient->response[$base_name] = License::PRODUCT_TYPE === 'plugin' ? (object) $update_info : $update_info;
		}

        $license_info = $license_manager->get_license_info();

        if (!empty($license_info)) {
            $license_manager->verify_license($license_info);
        }

		return $transient;
    }
}
