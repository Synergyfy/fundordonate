<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\License;
use GrowfundPro\Managers\LicenseManager;

class PluginsApiFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::PLUGINS_API;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function get_priority()
    {
        return 20;
    }

    public function get_args_count()
    {
		return 3; 
    }

    public function handle(...$args)
    {
        $res = $args[0] ?? null;
        $action = $args[1] ?? null;
        $args = $args[2] ?? null;
        if ($action !== 'plugin_information') {
				return false;
		}

			// do nothing if it is not our plugin.
		if ($args->slug !== License::PRODUCT_SLUG && $args->slug !== GROWFUND_PRO_BASENAME) {
			return $res;
		}

        $license_manager = LicenseManager::getInstance();
        $remote = $license_manager->check_for_update();

		if (!is_wp_error($remote)) {
			$res               = new \stdClass();
			$res->name         = $remote['body_response']['plugin_name'];
			$res->slug         = License::PRODUCT_SLUG;
			$res->version      = $remote['body_response']['version'];
			$res->last_updated = $remote['body_response']['updated_at'];
			$res->sections     = array(
				'changelog' => $remote['body_response']['change_log'],
			);

			return $res;
		}

		return false;
    }
}
