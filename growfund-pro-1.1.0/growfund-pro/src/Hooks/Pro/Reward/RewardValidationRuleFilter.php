<?php

namespace GrowfundPro\Hooks\Pro\Reward;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Hooks\BaseHook;

class RewardValidationRuleFilter extends BaseHook
{
    public function get_name()
    {
        return ProHookNames::GROWFUND_REWARD_VALIDATION_RULES_FILTER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $rules = $args[0];
        
        $rules['items'] = 'required|array';

        return $rules;
    }
}
