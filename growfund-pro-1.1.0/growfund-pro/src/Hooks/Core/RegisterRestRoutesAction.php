<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class RegisterRestRoutesAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_ROUTE_BEFORE_INIT_ACTION;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        require_once GROWFUND_PRO_DIR_PATH . '/routes/api.php';
    }
}
