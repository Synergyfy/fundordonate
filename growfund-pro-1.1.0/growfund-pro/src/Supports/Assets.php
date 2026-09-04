<?php

namespace GrowfundPro\Supports;

defined( 'ABSPATH' ) || exit;

use Growfund\Supports\Assets as FreeAssets;

class Assets extends FreeAssets {
    public static function load_vite_client() {
        wp_enqueue_script( // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.NotInFooter
            'growfund-vite-pro-app',
            'http://localhost:5173/growfund-pro/src/index.ts',
            ['growfund-vite-client'],
            null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
        );

        add_filter('script_loader_tag', function ($tag, $handle){
            if ($handle === 'growfund-vite-pro-app') {
                return str_replace('<script ', '<script type="module" ', $tag);
            }
                return $tag;
        }, 10, 2);
    }
}
