<?php

namespace GrowfundPro\Mails;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\DateTimeFormats;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Mailer;
use Growfund\Services\CampaignService;
use Growfund\Supports\CampaignGoal;
use Growfund\Supports\Date;
use InvalidArgumentException;

class CampaignPostUpdateMail extends Mailer
{
    public function with($data)
    {
        if (!isset($data['campaign_id'])) {
            throw new InvalidArgumentException(esc_html__('Campaign ID is required', 'growfund-pro'));
        }

        if (!isset($data['receiver_user_id'])) {
            throw new InvalidArgumentException(esc_html__('Receiver User ID is required', 'growfund-pro'));
        }

        $user = growfund_user($data['receiver_user_id']);

        if ($user->is_admin()) {
            $this->using(MailKeys::ADMIN_CAMPAIGN_POST_UPDATE);
            $data['admin_name'] = $user->get_display_name();
        } elseif ($user->is_fundraiser()) {
            $this->using(MailKeys::FUNDRAISER_CAMPAIGN_POST_UPDATE);
            $data['fundraiser_name'] = $user->get_display_name();
        } elseif ($user->is_donor()) {
            $this->using(MailKeys::DONOR_CAMPAIGN_POST_UPDATE);
            $data['donor_name'] = $user->get_display_name();
        } elseif ($user->is_backer()) {
            $this->using(MailKeys::BACKER_CAMPAIGN_POST_UPDATE);
            $data['backer_name'] = $user->get_display_name();
        } else {
            $this->ignore_mail();
        }

        $this->set_receiver_user_id($user->get_id());
        $this->to($user->get_email());

        $campaign_dto = (new CampaignService())->get_by_id($data['campaign_id'])->get_values();

        $campaign = [
            'campaign_title' => $campaign_dto->title,
            'description' => $campaign_dto->description,
            'campaign_creator' => $campaign_dto->author->display_name ?? '',
            'campaign_start_date' => Date::format($campaign_dto->start_date, DateTimeFormats::HUMAN_READABLE_DATE),
            'funded_percent' => CampaignGoal::goal_achieved_percentage($campaign_dto),
            'campaign_goal' => CampaignGoal::prepare_goal_for_display($campaign_dto->goal_type, $campaign_dto->goal_amount),
            'image' => $campaign_dto->images[0]['url'] ?? growfund_placeholder_image_url(),
            'campaign_url' => growfund_campaign_url($campaign_dto->slug),
            'fund_raised' => $campaign_dto->fund_raised,
        ];

        return parent::with(
            array_merge([
                'campaign_details_card' => growfund_renderer()->get_html('mails.components.campaign-details-card', [
                    'campaign' => $campaign,
                    'button' => growfund_renderer()->get_html('mails.components.link-button', [
                        'text' => __('See Update', 'growfund'),
                        'link' => $campaign['campaign_url'],
                        'colors' => $this->get_colors(),
                    ]),
                ]),
                'campaign_title' => $campaign['campaign_title'],
                'campaign_url' => $campaign['campaign_url'],
            ], $data)
        );
    }
}
