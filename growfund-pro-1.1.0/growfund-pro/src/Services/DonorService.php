<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Activities;
use Growfund\DTO\Activity\ActivityFilterDTO;
use Growfund\DTO\Donor\DonorOverviewDTO;
use Exception;
use Growfund\Services\ActivityService;
use Growfund\Services\DonorService as FreeDonorService;

class DonorService extends FreeDonorService {
    /**
     * Get donor overview
     * @param int $id
     * 
     * @return DonorOverviewDTO
     * 
     * @throws Exception
     */
    public function get_overview(int $id)
    {
        $donor_info = $this->get_by_id($id);

        $activity_filter_dto = ActivityFilterDTO::from_array([
            'page' => 1,
            'limit' => 6,
            'orderby' => 'created_at',
            'order' => 'DESC',
            'user_id' => $id,
        ]);

        $activities = (new ActivityService())->paginated($activity_filter_dto, Activities::DONOR);

        return DonorOverviewDTO::from_array([
            'id' => (string) $id,
            'total_contributions' => $donor_info->total_contributions,
            'average_donation' => $this->donation_service->get_average_contribution_amount_by_donor($id),
            'donated_campaigns' => $this->donation_service->get_successfully_donated_campaigns_by_donor($id),
            'number_of_contributions' => $donor_info->number_of_contributions,
            'profile' => $donor_info,
            'activity_logs' => !empty($activities['results']) ? $activities['results'] : [],
        ]);
    }
}
