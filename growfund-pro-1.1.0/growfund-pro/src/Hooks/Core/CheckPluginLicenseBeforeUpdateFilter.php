<?php
namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Http\Response;
use GrowfundPro\License;
use GrowfundPro\Managers\LicenseManager;

class CheckPluginLicenseBeforeUpdateFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::UPGRADER_PRE_DOWNLOAD;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function get_args_count()
    {
        return 3;
    }

    public function handle(...$args)
    {
        $reply = $args[0] ?? null;
        $package = $args[1] ?? null;
        $upgrader = $args[2] ?? null;
        
        if (is_object($upgrader) && property_exists($upgrader->skin, 'plugin_info')) {

			if (strpos($upgrader->skin->plugin_info['TextDomain'] ?? '', License::PRODUCT_SLUG) === false) {
				return $reply;
			}

            $license_manager = LicenseManager::getInstance();

			$response = $license_manager->check_for_update();

			if ($response['status'] !== Response::OK) {
				return new \WP_Error(
					'license_required',
					__('A valid license key is required to update Growfund Pro. Please enter your license key in the plugin settings.', 'growfund-pro')
				);
			}
		}

		return $reply;
    }
}
