<?php

namespace GrowfundPro\Exports;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Contracts\Exportable;
use Growfund\DTO\Campaign\CampaignRawDTO;
use Growfund\Services\CampaignService;
use Growfund\Supports\Arr;

class CampaignExport implements Exportable
{
    /**
     * @var \Growfund\DTO\Campaign\CampaignDTO
     */
    private $campaign;

    public function __construct(int $campaign_id)
    {
        $this->campaign = (new CampaignService())->get_by_id($campaign_id);
    }

    /**
     * Export the campaign as CampaignRawDTO
     * 
     * @return \Growfund\DTO\Campaign\CampaignRawDTO
     */
    public function export()
    {
        $dto = new CampaignRawDTO();

        $dto->id = $this->campaign->id;
        $dto->title = $this->campaign->title;
        $dto->slug = $this->campaign->slug;
        $dto->description = $this->campaign->description;
        $dto->story = $this->campaign->story;

        if (!empty($this->campaign->images)) {
            $dto->images = Arr::make($this->campaign->images)->map(function ($image) {
                return $image['id'];
            })->toArray();
        }

        if (!empty($this->campaign->video)) {
            $dto->video = [
                "id" => $this->campaign->video['id'],
                "poster" => $this->campaign->video['poster']['id'] ?? 0,
            ];
        }

        $dto->is_featured = $this->campaign->is_featured;
        $dto->category = $this->campaign->category;
        $dto->sub_category = $this->campaign->sub_category;
        $dto->start_date = $this->campaign->start_date;
        $dto->end_date = $this->campaign->end_date;
        $dto->location = $this->campaign->location;
        $dto->tags = $this->campaign->tags;
        $dto->collaborators = $this->campaign->collaborators;
        $dto->show_collaborator_list = $this->campaign->show_collaborator_list;
        $dto->status = $this->campaign->status;
        $dto->risk = $this->campaign->risk;
        $dto->has_goal = $this->campaign->has_goal;
        $dto->goal_type = $this->campaign->goal_type;
        $dto->goal_amount = $this->campaign->goal_amount;
        $dto->reaching_action = $this->campaign->reaching_action;
        $dto->confirmation_title = $this->campaign->confirmation_title;
        $dto->confirmation_description = $this->campaign->confirmation_description;
        $dto->provide_confirmation_pdf_receipt = $this->campaign->provide_confirmation_pdf_receipt;
        $dto->faqs = $this->campaign->faqs;
        $dto->is_paused = $this->campaign->is_paused;
        $dto->is_hidden = $this->campaign->is_hidden;

        if (growfund_app()->is_donation_mode()) {
            $dto->has_tribute = $this->campaign->has_tribute;
            $dto->tribute_requirement = $this->campaign->tribute_requirement;
            $dto->tribute_title = $this->campaign->tribute_title;
            $dto->tribute_options = $this->campaign->tribute_options;
            $dto->tribute_notification_preference = $this->campaign->tribute_notification_preference;
            $dto->fund_selection_type = $this->campaign->fund_selection_type;
            $dto->default_fund = $this->campaign->default_fund;
            $dto->fund_choices = $this->campaign->fund_choices;
            $dto->allow_custom_donation = $this->campaign->allow_custom_donation;
            $dto->min_donation_amount = $this->campaign->min_donation_amount;
            $dto->max_donation_amount = $this->campaign->max_donation_amount;
            $dto->suggested_option_type = $this->campaign->suggested_option_type;
            $dto->suggested_options = $this->campaign->suggested_options;
        } else {
            $dto->rewards = $this->campaign->rewards;
            $dto->allow_pledge_without_reward = $this->campaign->allow_pledge_without_reward;
            $dto->min_pledge_amount = $this->campaign->min_pledge_amount;
            $dto->max_pledge_amount = $this->campaign->max_pledge_amount;
            $dto->appreciation_type = $this->campaign->appreciation_type;
            $dto->giving_thanks = $this->campaign->giving_thanks;
        }

        return $dto;
    }
}
