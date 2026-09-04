<?php

defined( 'ABSPATH' ) || exit;

use Growfund\Sanitizer;
use GrowfundPro\Core\PluginInstaller;

if (!function_exists('can_load_growfund_pro')) {
	/**
	 * Check if the Growfund plugin is active.
	 *
	 * This function is used to check all the prerequisites for the Growfund Pro plugin.
	 *
	 * @return bool
	 */
    function can_load_growfund_pro() {
        return is_growfund_active();
    }
}

if (!function_exists('is_growfund_installed')) {
	/**
	 * Check if the Growfund plugin is installed.
	 *
	 * @return bool
	 */
    function is_growfund_installed() {
        return file_exists( WP_PLUGIN_DIR . '/' . GROWFUND_PRO_DEP_FILE );
    }
}

if (!function_exists('is_growfund_active')) {
	/**
	 * Check if the Growfund plugin is active.
	 *
	 * @return bool
	 */
    function is_growfund_active() {
        return is_growfund_installed() && is_plugin_active(GROWFUND_PRO_DEP_FILE);
    }
}

if (!function_exists('is_growfund_pro_matched_version')) {
    /**
     * Check if the Growfund plugin version is matched.
     * 
     * @return bool
     */
    function is_growfund_pro_matched_version() {
        return defined('GROWFUND_VERSION') && version_compare(GROWFUND_PRO_VERSION, GROWFUND_VERSION, '=');
    }
}

if (!function_exists('growfund_pro_installer')) {
    /**
     * Make the PluginInstaller instance
     *
     * @return \GrowfundPro\Core\PluginInstaller
     */
    function growfund_pro_installer()
    {
        if (!function_exists('growfund_app')) {
            return new PluginInstaller();
        }

        return growfund_app()->make(PluginInstaller::class);
    }
}

if (!function_exists('growfund_pro_input_get')) {
    /**
     * Retrieve a value from the $_GET.
     * 
     * @param string $key The key to retrieve.
     * @param mixed $default The default value to return if the key is not found.
     * @param string $sanitizer_type The type of sanitizer to apply to the value.
     * @return mixed The value of the key, or the default value if not found.
     */
    function growfund_pro_input_get($key, $default = null, $sanitizer_type = Sanitizer::TEXT) {
        if (function_exists('growfund_input_get')) {
            return growfund_input_get($key, $default, $sanitizer_type);
        }

        if ($sanitizer_type === Sanitizer::ARRAY) {
            $input = Sanitizer::apply_rule(filter_input(INPUT_GET, $key, FILTER_DEFAULT, FILTER_REQUIRE_ARRAY), $sanitizer_type);
        } else {
            $input = Sanitizer::apply_rule(filter_input(INPUT_GET, $key, FILTER_DEFAULT), $sanitizer_type);
        }

        if (is_null($input)) {
            return $default;
        }

        return $input;
    }
}

if (!function_exists('growfund_pro_input_post')) {
    /**
     * Retrieve a value from the $_POST.
     * 
     * @param string $key The key to retrieve.
     * @param mixed $default The default value to return if the key is not found.
     * @param string $sanitizer_type The type of sanitizer to apply to the value.
     * @return mixed The value of the key, or the default value if not found.
     */
    function growfund_pro_input_post($key, $default = null, $sanitizer_type = Sanitizer::TEXT) {
        if (function_exists('growfund_input_post')) {
            return growfund_input_post($key, $default, $sanitizer_type);
        }

		if ($sanitizer_type === Sanitizer::ARRAY) {
            $input = Sanitizer::apply_rule(filter_input(INPUT_POST, $key, FILTER_DEFAULT, FILTER_REQUIRE_ARRAY), $sanitizer_type);
        } else {
            $input = Sanitizer::apply_rule(filter_input(INPUT_POST, $key, FILTER_DEFAULT), $sanitizer_type);
        }

        if (is_null($input)) {
            return $default;
        }

        return $input;
    }
}

if (!function_exists('growfund_pro_input_server')) {
    /**
     * Retrieve a value from the $_SERVER.
     * 
     * @param string $key The key to retrieve.
     * @param mixed $default The default value to return if the key is not found.
     * @param string $sanitizer_type The type of sanitizer to apply to the value.
     * @return mixed The value of the key, or the default value if not found.
     */
    function growfund_pro_input_server($key, $default = null, $sanitizer_type = Sanitizer::TEXT) {
        if (function_exists('growfund_input_server')) {
            return growfund_input_server($key, $default, $sanitizer_type);
        }

        if ($sanitizer_type === Sanitizer::ARRAY) {
            $input = Sanitizer::apply_rule(filter_input(INPUT_SERVER, $key, FILTER_DEFAULT, FILTER_REQUIRE_ARRAY), $sanitizer_type);
        } else {
            $input = Sanitizer::apply_rule(filter_input(INPUT_SERVER, $key, FILTER_DEFAULT), $sanitizer_type);
        }

        if (is_null($input)) {
            return $default;
        }

        return $input;
    }
}

if (!function_exists('growfund_pro_flash_message')) {
    /**
     * Get the flash message.
     * 
     * @param string $key
     * @param string|null $message
     * @return string|void
     */
    function growfund_pro_flash_message($key, $message = null)
    {
        if (function_exists('growfund_flash_message')) {
            return growfund_flash_message($key, $message);
        }

        if (empty($message)) {
            return '';
        }
    }
}

if (!function_exists('growfund_pro_flash_set_message')) {
    /**
     * Set the flash message.
     * 
     * @param string $key
     * @param string $message
     * @return void
     */
    function growfund_pro_flash_set_message($key, $message)
    {
        if (function_exists('growfund_flash_set_message')) {
            return growfund_flash_set_message($key, $message);
        }
    }
}

if (!function_exists('growfund_pro_flash_get_message')) {
    /**
     * Get the flash message.
     * 
     * @param string $key
     * @return string
     */
    function growfund_pro_flash_get_message($key)
    {
        if (function_exists('growfund_flash_get_message')) {
            return growfund_flash_get_message($key);
        }

        return "";
    }
}

if (!function_exists('growfund_pro_query_log')) {
    function growfund_pro_query_log($overwrite = false) {
        if (growfund_is_dev_mode() && defined('WP_DEBUG') && WP_DEBUG) {
			add_filter( 'query', function( $query ) use ($overwrite) {
                if (!defined('WP_CONTENT_DIR')) {
                    // Defines WP_CONTENT_DIR just in case it is not defined.
                    define('WP_CONTENT_DIR', ABSPATH . 'wp-content');
                }

				$log_file = WP_CONTENT_DIR . '/growfund-sql-query.log';

                if ($overwrite) {
                    growfund_file_put_contents($log_file, " $query\n\n");

                    return $query;
                }
                
                growfund_file_put_contents($log_file, " $query\n\n", 'append');
                
				return $query;
			});
        }
    }
}
