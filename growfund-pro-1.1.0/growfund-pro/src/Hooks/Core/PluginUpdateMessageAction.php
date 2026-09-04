<?php
namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use GrowfundPro\License;

class PluginUpdateMessageAction extends BaseHook
{
    public function get_name()
    {
        return 'in_plugin_update_message-' . GROWFUND_PRO_BASENAME;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function get_args_count()
    {
        return 2;
    }

    public function handle(...$args)
    {
        $plugin_data = $args[0] ?? null;
        $response = $args[1] ?? null;
        if (! $response || ! $response->package ) {
            $error_message = get_option(License::ERROR_OPTION_KEY);
            echo $error_message ? ' ' . wp_kses_post($error_message) . '' : '';
		}
    }
}
