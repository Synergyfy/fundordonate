<?php

namespace GrowfundPro\Hooks;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\Core\CoreHooks;
use GrowfundPro\Hooks\Pro\ProHooks;

class Hooks implements HookProvider {
    public static function get()
    {
        return array_merge(
            CoreHooks::get(),
            ProHooks::get(),
        );
    }
}
