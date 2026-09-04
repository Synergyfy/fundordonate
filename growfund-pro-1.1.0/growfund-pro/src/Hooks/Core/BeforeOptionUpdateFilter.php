<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class BeforeOptionUpdateFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_BEFORE_OPTION_UPDATE_FILTER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function get_args_count()
    {
        return 2;
    }

    public function handle(...$args)
    {
        list($new_data, $original_data) = $args;

        return $original_data;
    }
}
