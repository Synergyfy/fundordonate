<?php

namespace GrowfundPro;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Managers\LicenseManager;

class License
{
    const SECRET_KEY = 't344d5d71sae7dcb546b8cf55e594808';
    const OPTION_KEY = 'growfund_license_info';
    const TRANSIENT_KEY = 'growfund_license_transient_key';
    const PRODUCT_SLUG = GROWFUND_PRO_SLUG;
    const ERROR_OPTION_KEY = 'themeum_update_error_' . GROWFUND_PRO_BASENAME;
    const FORCE_UPDATE_CHECK = false;
    const PRODUCT_TYPE = 'plugin';
    const VERIFICATION_ATTEMPT_KEY = 'growfund_license_verification_attempt';
    const MAX_VERIFICATION_ATTEMPT = 3;

    public static function get_platform_api_endpoint()
    {
        return defined('GROWFUND_PLATFORM_API_ENDPOINT') ? GROWFUND_PLATFORM_API_ENDPOINT : 'https://growfund.com/wp-json/themeum-products/v1/';
    }

    public static function get_transient_expiration_time()
    {
        return growfund_is_dev_mode() ? MINUTE_IN_SECONDS : DAY_IN_SECONDS;
    }

    public static function is_active()
    {
        $license_manager = LicenseManager::getInstance();

        $info = $license_manager->get_license_info();

        if (empty($info)) {
            return false;
        }

        if (!empty($info['is_expired'])) {
            return false;
        }

        return $info['activated'] ?? false;
    }
}
