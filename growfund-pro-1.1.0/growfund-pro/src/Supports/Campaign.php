<?php

namespace GrowfundPro\Supports;

use Growfund\Constants\FeeType;
use Growfund\Core\AppSettings;
use Growfund\Supports\Money;
use Growfund\Supports\PostMeta;

defined( 'ABSPATH' ) || exit;

class Campaign {
    /**
     * @param int $campaign_id
     * 
     * @return int
     */
    public static function get_platform_fee(int $campaign_id) {
        $platform_fee = PostMeta::get($campaign_id, 'platform_fee');

        $platform_fee = $platform_fee ?? growfund_settings(AppSettings::PAYMENT)->get_platform_fee();

        return (int) $platform_fee;
    }

    /**
     * @param int $campaign_id
     * 
     * @return string
     */
    public static function get_platform_fee_type(int $campaign_id) {
        $platform_fee_type = PostMeta::get($campaign_id, 'platform_fee_type');

        return $platform_fee_type ?? growfund_settings(AppSettings::PAYMENT)->get_platform_fee_type();
    }

    /**
     * @param int $campaign_id
     * 
     * @return bool
     */
    public static function is_enabled_platform_fee(int $campaign_id) {
        $is_enabled_platform_fee = PostMeta::get($campaign_id, 'enabled_platform_fee');
        $is_enabled_platform_fee = !is_null($is_enabled_platform_fee) 
            ? (bool) $is_enabled_platform_fee 
            : growfund_settings(AppSettings::PAYMENT)->is_enabled_platform_fee();

        return $is_enabled_platform_fee;
    }

    /**
     * @param int $campaign_id
     * @param int $total_amount
     * 
     * @return int
     */
    public static function calculate_platform_fee(int $campaign_id, int $total_amount)
    {
        $is_enabled_platform_fee = static::is_enabled_platform_fee($campaign_id);

        if (!$is_enabled_platform_fee) {
            return 0;
        }

        $platform_fee = static::get_platform_fee($campaign_id);
        $platform_fee_type = static::get_platform_fee_type($campaign_id);

        if ($platform_fee_type === FeeType::PERCENTAGE) {
            $total_amount = Money::prepare_for_display($total_amount);
            $platform_fee = Money::prepare_for_display($platform_fee);

            return Money::prepare_for_storage($total_amount * $platform_fee / 100);
        }

        return $platform_fee;
    }
}
