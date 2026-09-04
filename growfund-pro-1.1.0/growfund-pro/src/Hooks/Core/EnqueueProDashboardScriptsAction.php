<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\Supports\Assets;
use Growfund\Supports\ViteManifest;

class EnqueueProDashboardScriptsAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::WP_ENQUEUE_SCRIPT;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function get_priority()
    {
        return 2;
    }

    public function handle(...$args)
    {
        if (!growfund_is_react_site()) {
            return;
        }

        if (growfund_is_dev_mode()) {
            Assets::load_vite_client();
            return;
        }

        $pro_vite = new ViteManifest(
            GROWFUND_PRO_DIR_PATH . 'resources/dist/',
            GROWFUND_PRO_DIR_URL . 'resources/dist/',
        );
        $pro_entrypoint = $pro_vite->get_entrypoint('growfund/src/main.tsx', true);

        if (empty($pro_entrypoint) || empty($pro_entrypoint['url'])) {
            return;
        }

        wp_enqueue_script(
            'growfund-pro-bundle',
            $pro_entrypoint['url'],
            [],
            GROWFUND_PRO_VERSION,
            true
        );
        
        add_filter('script_loader_tag', function ($tag, $handle) {
            if ($handle === 'growfund-pro-bundle') {
                return str_replace('<script ', '<script type="module" ', $tag);
            }
            return $tag;
        }, 10, 3);

        Assets::load_js_translations('growfund', 'growfund-pro-bundle');
    }
}
