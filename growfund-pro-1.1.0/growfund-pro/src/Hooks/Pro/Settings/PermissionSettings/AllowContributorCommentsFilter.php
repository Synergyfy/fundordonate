<?php

namespace GrowfundPro\Hooks\Pro\Settings\PermissionSettings;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class AllowContributorCommentsFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_ALLOW_CONTRIBUTOR_COMMENTS_FILTER;
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
        $value = $args[0];
        $settings = $args[1];
        
		return isset($settings['allow_contributor_comments'])
            ? filter_var($settings['allow_contributor_comments'], FILTER_VALIDATE_BOOLEAN)
            : false;
    }
}
