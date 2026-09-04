<?php

namespace GrowfundPro\Mails\Fundraiser;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\DateTimeFormats;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Constants\Status\CampaignStatus;
use Growfund\Mailer;
use Growfund\Services\CampaignService;
use Growfund\Supports\CampaignGoal;
use Growfund\Supports\Date;
use InvalidArgumentException;

class CampaignDeclinedMail extends Mailer
{
    protected $content_key = MailKeys::FUNDRAISER_CAMPAIGN_DECLINED;

    public function with($data)
    {
        if (!isset($data['campaign_id'])) {
            throw new InvalidArgumentException(esc_html__('Campaign ID is required', 'growfund-pro'));
        }

        $campaign_dto = (new CampaignService())->get_by_id($data['campaign_id'])->get_values();

        if (!$campaign_dto->fundraiser || $campaign_dto->status !== CampaignStatus::DECLINED) {
            $this->ignore_mail();
        }

        $this->set_receiver_user_id($campaign_dto->fundraiser->id ?? 0);
        $this->to($campaign_dto->fundraiser->email ?? '');

        $campaign = [
            'campaign_title' => $campaign_dto->title,
            'campaign_url' => growfund_campaign_url(get_post_field('post_name', $campaign_dto->id)),
            'campaign_creator' => $campaign_dto->author->display_name ?? '',
            'campaign_start_date' => Date::format($campaign_dto->start_date, DateTimeFormats::HUMAN_READABLE_DATE),
            'funded_percent' => CampaignGoal::goal_achieved_percentage($campaign_dto),
            'campaign_goal' => CampaignGoal::prepare_goal_for_display($campaign_dto->goal_type, $campaign_dto->goal_amount),
            'image' => $campaign_dto->images[0]['url'] ?? growfund_placeholder_image_url(),
        ];

        return parent::with([
            'campaign_card' => growfund_renderer()->get_html('mails.components.campaign-card', [
                'campaign' => $campaign
            ]),
            'admin_feedback_card' => growfund_renderer()->get_html('mails.components.fundraiser.admin-feedback-card', [
                'last_decline_reason' => $campaign_dto->last_decline_reason
            ]),
            'campaign_link_button' => growfund_renderer()->get_html('mails.components.link-button', [
                'text' => __('Edit Your Campaign', 'growfund-pro'),
                'link' => $campaign['campaign_url'],
                'colors' => $this->get_colors(),
            ]),
            'fundraiser_name' => $campaign_dto->fundraiser->display_name ?? '',
            'campaign_title' => $campaign['campaign_title'],
            'campaign_url' => $campaign['campaign_url'],
            'campaign_creator' => $campaign['campaign_creator'],
            'campaign_start_date' => $campaign['campaign_start_date'],
            'funded_percent' => $campaign['funded_percent'],
            'campaign_goal' => $campaign['campaign_goal'],
        ]);
    }
}
