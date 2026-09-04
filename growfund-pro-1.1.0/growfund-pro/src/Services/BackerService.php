<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Activities;
use Growfund\DTO\Activity\ActivityFilterDTO;
use Growfund\DTO\Backer\BackerOverviewDTO;
use Growfund\Services\ActivityService;
use Growfund\Services\BackerService as FreeBackerService;

class BackerService extends FreeBackerService
{
    /**
     * Get Backer overview by id.
     * 
     * @param int $id Backer id.
     * @return \Growfund\DTO\Backer\BackerOverviewDTO.
     */
    public function get_overview(int $id)
    {
        $activity_filter_dto = ActivityFilterDTO::from_array([
            'page' => 1,
            'limit' => 6,
            'orderby' => 'created_at',
            'order' => 'DESC',
            'user_id' => $id,
        ]);

        $activities = (new ActivityService())->paginated($activity_filter_dto, Activities::BACKER);

        return BackerOverviewDTO::from_array([
            'pledged_amount' => $this->pledge_service->get_total_pledges_amount($id),
            'backed_amount' => $this->pledge_service->get_total_backed_amount($id),
            'pledged_campaigns' => $this->pledge_service->get_pledged_campaigns_by_backer($id),
            'backed_campaigns' => $this->pledge_service->get_successfully_backed_campaigns_by_backer($id),
            'backer_information' => $this->get_by_id($id),
            'activity_logs' => !empty($activities['results']) ? $activities['results'] : [],
        ]);
    }
}
