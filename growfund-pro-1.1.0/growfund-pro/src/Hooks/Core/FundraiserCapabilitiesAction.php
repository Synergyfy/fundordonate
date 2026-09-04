<?php

namespace GrowfundPro\Hooks\Core;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Hooks\BaseHook;

/**
 * Add capabilities to the fundraiser role
 * Capabilities:
 * - upload_files
 * - ...
 *
 * @since 1.0.0
 */
class FundraiserCapabilitiesAction extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::INIT;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $role = get_role(Fundraiser::ROLE);

        if (!$role) {
            return;
        }

        if (!$role->has_cap('upload_files')) {
            $role->add_cap('upload_files', true);
        }

        if (!$role->has_cap('edit_posts')) {
            $role->add_cap('edit_posts', true);
        }

        if (!$role->has_cap('read')) {
            $role->add_cap('read', true);
        }
    }
}
