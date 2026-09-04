<?php
/**
* Plugin Name:       Growfund Pro
* Plugin URI:        https://growfund.com
* Description:       Take fundraising further with Growfund’s advanced features.
* Version:           1.1.0
* Author:            Themeum
* Author URI:        https://themeum.com
* Text Domain:       growfund-pro
* Requires PHP:      7.4
* Requires at least: 5.9
* Tested up to:      6.9
* License:           GPLv2 or later
* License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
* Domain Path:       /languages
* 
* @package GrowfundPro
*/

use GrowfundPro\Application;
use GrowfundPro\Managers\LicenseManager;

if (!defined('ABSPATH')) {
    exit;
}
/**
 * Define plugin version
 */
define('GROWFUND_PRO_VERSION', '1.1.0');

/**
 * Define plugin file
 * @since   1.0.0
 */
define('GROWFUND_PRO_PLUGIN_FILE', __FILE__);

/**
 * Define plugin working directory
 * @since   1.0.0
 */
define('GROWFUND_PRO_WORKING_DIRECTORY', dirname(GROWFUND_PRO_PLUGIN_FILE));

/**
 * Define plugin root url
 * @since   1.0.0
 */
define('GROWFUND_PRO_ROOT_URL', plugin_dir_url(__FILE__));

/**
 * Define plugin directory url
 * @since   1.0.0
 */
define('GROWFUND_PRO_DIR_URL', plugin_dir_url(__FILE__));

/**
 * Define plugin directory path
 * @since   1.0.0
 */
define('GROWFUND_PRO_DIR_PATH', plugin_dir_path(__FILE__));

/**
 * Define plugin directory src path
 * @since   1.0.0
 */
define('GROWFUND_PRO_SRC_PATH', GROWFUND_PRO_DIR_PATH . 'src/');

/**
 * Define the react application root url
 * @since 1.0.0
 */
define('GROWFUND_PRO_REACT_APP_URL', GROWFUND_PRO_DIR_URL . 'resources/ts/');

/**
 * Define the react application root path
 * @since 1.0.0
 */
define('GROWFUND_PRO_REACT_APP_PATH', GROWFUND_PRO_DIR_PATH . 'resources/ts/');

/**
 * Define plugin base name
 * @since   1.0.0
 */
define('GROWFUND_PRO_BASENAME', plugin_basename(__FILE__));


/**
 * Define plugin slug
 * @since   1.0.0
 */
define('GROWFUND_PRO_SLUG', dirname(GROWFUND_PRO_BASENAME));

/**
 * Define plugin environment mode
 * Available values - development|production
 * @since   1.0.0
 */
define('GROWFUND_PRO_ENV_MODE', 'production');

/**
 * Define plugin prefix
 * @since   1.0.0
 */
define('GROWFUND_PRO_PREFIX', 'GROWFUND_PRO_');

/**
 * Define plugin dependency slug
 * @since   1.0.3
 */
define( 'GROWFUND_PRO_DEP_SLUG', 'growfund' );

/**
 * Define plugin dependency file
 * @since   1.0.3
 */
define( 'GROWFUND_PRO_DEP_FILE', 'growfund/growfund.php' );


// Include the pro autoloader
require_once __DIR__ . '/vendor/autoload.php';

add_action('admin_init', function() {

	if (!is_growfund_active()) {
		deactivate_plugins(GROWFUND_PRO_BASENAME);

		add_action('admin_notices', function () {
			echo '<div class="notice notice-error"><p><strong>Growfund Pro:</strong> The Growfund plugin must be installed and activated to use Growfund Pro.</p></div>';
		});
	}

    add_filter('plugin_row_meta', function (array $links, string $plugin_name) {
        if ($plugin_name !== GROWFUND_PRO_BASENAME) {
            return $links;
        }

        if (!is_growfund_installed()) {
            $install_url = wp_nonce_url(
                admin_url( 'update.php?action=install-plugin&plugin=' . GROWFUND_PRO_DEP_SLUG ),
                'install-plugin_' . GROWFUND_PRO_DEP_SLUG
            );

            $links[] = '
                <div class="notice inline notice-warning notice-alt">
                    <p><strong>Growfund Pro:</strong> requires <strong>Growfund plugin</strong> Please <a href="' . esc_url($install_url) . '">install Growfund</a> first.</p>
                </div>
            ';

            return $links;
        }

        if (!is_growfund_active()) {
            $links[] = '<div class="notice inline notice-warning notice-alt">
                            <p><strong>Growfund Pro:</strong> You must activate <strong>Growfund plugin</strong> before activating Growfund Pro.</p>
                        </div>
                    ';

            return $links;
        }
                    
        return $links;
	}, 10, 2);
}, 20); // priority set to 20, so that it always loads after Growfund free plugin is loaded.

register_activation_hook(GROWFUND_PRO_PLUGIN_FILE, [Application::class, 'handle_activation']);
register_deactivation_hook(GROWFUND_PRO_PLUGIN_FILE, [Application::class, 'handle_deactivation']);
register_uninstall_hook(GROWFUND_PRO_PLUGIN_FILE, [Application::class, 'handle_uninstallation']);


add_action('plugins_loaded', 'growfund_pro_plugin_initializer', 20); // priority set to 20, so that it always loads after Growfund free plugin is loaded.

function growfund_pro_plugin_initializer()
{
	if (!can_load_growfund_pro()) {
        return;
    }

	if (is_admin() && !LicenseManager::getInstance()->has_license()) {
		add_action( 'admin_notices', 'license_notice' );
	}
    
	require_once __DIR__ . '/bootstrap/app.php';
}

function license_notice() {
	?>
		<div class="growfund-license-notice notice notice-error notice-warning is-dismissible">
			<div style="display: flex;align-items: center;padding: 8px 0px;gap: 16px;">
                <div>
                    <?php
                        $notice = __( 'Connect the license key to access the Growfund pro features!', 'growfund-pro' );
                        echo esc_html( $notice );
                    ?>
                </div>
                <a href="<?php echo esc_url( LicenseManager::getInstance()->get_license_settings_page_url() ); ?>" style="text-decoration: underline;">
                    <?php esc_html_e( 'Connect Now', 'growfund-pro' ); ?>
                </a>
			</div>
		</div>
	<?php
}

require_once __DIR__ . '/helpers.php';