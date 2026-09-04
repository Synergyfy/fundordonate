<?php

namespace GrowfundPro\Controllers\API;

defined( 'ABSPATH' ) || exit;

use Growfund\Contracts\Request;
use Growfund\Policies\CampaignPolicy;
use GrowfundPro\Services\CampaignService;

/**
 * Handles operations related to campaigns.
 *
 * @since 1.0.0
 */
class CampaignController
{
    /**
     * Campaign service instance.
     *
     * @var CampaignService
     */
    protected $service;

    protected $policy;

    /**
     * Initialize the controller with CampaignService.
     */
    public function __construct(CampaignService $service, CampaignPolicy $policy)
    {
        $this->service = $service;
        $this->policy = $policy;
    }

    public function make_a_copy(Request $request)
    {
        $this->policy->authorize_admin_only();

        $campaign_id = $request->get_int('campaign_id');

        $is_copied = $this->service->duplicate_campaign($campaign_id);

        return growfund_response()->json(
            [
                'data' => $is_copied,
                'message' => __('Campaign copied successfully', 'growfund-pro'),
            ]
        );
    }
}
