<?php

namespace GrowfundPro\Hooks\Pro\Campaign;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Campaign\AppreciationType;
use Growfund\Constants\Campaign\ReachingAction;
use Growfund\Constants\Campaign\SuggestedOptionType;
use GrowfundPro\Constants\ProHookNames;
use Growfund\Constants\HookTypes;
use Growfund\Constants\Status\CampaignStatus;
use Growfund\Hooks\BaseHook;

class UpdateValidationRuleFilter extends BaseHook{
	public function get_name()
    {
        return ProHookNames::GROWFUND_CAMPAIGN_UPDATE_VALIDATION_RULES_FILTER;
    }

    public function get_type()
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $rules = $args[0];
        $pro_rules = array_merge([
            'start_date' => 'required_if:status,published|string',
            'reaching_action' => [
                function ($value, $key, $data) {
					if ($data['status'] === CampaignStatus::PUBLISHED && $data['has_goal'] === true && empty($value)) {
						/* translators: %s: field name */
						return sprintf(__('The %s field is required.', 'growfund-pro'), str_replace(['_', '.'], ' ', $key));
					}

					return true;
				},
				'string',
				'in:' . implode(',', ReachingAction::get_constant_values())
            ],
            
            'faqs' => 'array',
            'faqs.*.question' => 'required|string',
			'faqs.*.answer' => 'required|string',
        ],
            growfund_app()->is_donation_mode() ? [
                'suggested_option_type' => 'in:' . implode(',', SuggestedOptionType::get_constant_values()),
                'suggested_options.*.description' => [
					function ($value, $key, $data) {
						if ($data['status'] === CampaignStatus::PUBLISHED && $data['suggested_option_type'] === 'amount-description' && empty($value)) {
							/* translators: %s: field name */
							return sprintf(__('The %s field is required.', 'growfund'), str_replace(['_', '.'], ' ', $key));
						}

						return true;
					},
					'string',
				],
            ] : [
                'rewards' => [
					function ($value, $key, $data) {
						if ($data['status'] === CampaignStatus::PUBLISHED && $data['appreciation_type'] === AppreciationType::GOODIES && empty($value)) {
							/* translators: %s: field name */
							return sprintf(__('The %s field is required.', 'growfund'), str_replace(['_', '.'], ' ', $key));
						}

						return true;
					},
					'array'
				],
                'rewards.*' => 'required|integer',
            ]
		);

        return array_merge($rules, $pro_rules);
    }
}
