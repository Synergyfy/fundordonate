<?php

namespace GrowfundPro\Hooks\Pro\Donation;

use GrowfundPro\Hooks\HookProvider;

defined( 'ABSPATH' ) || exit;

class DonationHooks implements HookProvider {
    public static function get()
    {
        return [
            DonationAfterCompletedAction::class,
        ];
    }
}
