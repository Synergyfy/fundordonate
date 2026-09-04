<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;
use Growfund\Supports\Branding;

class EnqueueScriptsProSite extends BaseHook
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
        return 30;
    }

    public function handle(...$args)
    {
        if (!can_load_growfund_pro() || growfund_is_react_site()) {
            return;
        }

        Branding::enqueue_branding_style_variables();
    }
}
