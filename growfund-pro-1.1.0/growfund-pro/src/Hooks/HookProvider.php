<?php

namespace GrowfundPro\Hooks;

defined( 'ABSPATH' ) || exit;

interface HookProvider {
    /**
     * @return array
     */
    public static function get();
}
