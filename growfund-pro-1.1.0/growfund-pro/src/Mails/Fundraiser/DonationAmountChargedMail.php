<?php

namespace GrowfundPro\Mails\Fundraiser;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\DateTimeFormats;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Constants\Status\DonationStatus;
use Growfund\Core\AppSettings;
use Growfund\Mailer;
use Growfund\Services\CampaignService;
use Growfund\Services\DonationService;
use Growfund\Supports\CampaignGoal;
use Growfund\Supports\Date;
use InvalidArgumentException;

class DonationAmountChargedMail extends Mailer
{
    protected $content_key = MailKeys::FUNDRAISER_DONATION_AMOUNT_CHARGED;

    public function with($data)
    {

        if (!isset($data['donation_id'])) {
            throw new InvalidArgumentException(esc_html__('Donation ID is required', 'growfund-pro'));
        }

        if (!isset($data['receiver_user_id'])) {
            throw new InvalidArgumentException(esc_html__('Receiver User ID is required', 'growfund-pro'));
        }

        $user = growfund_user($data['receiver_user_id']);

        if (! $user->is_fundraiser()) {
            $this->ignore_mail();
        }

        $this->set_receiver_user_id($data['receiver_user_id']);
        $this->to($user->get_email());

        $donation_dto = (new DonationService())->get_by_id($data['donation_id'])->get_values();

        if ($donation_dto->status !== DonationStatus::COMPLETED) {
            $this->ignore_mail();
        }

        $donation = [
            'campaign_title' => $donation_dto->campaign->title,
            'campaign_url' => growfund_campaign_url(get_post_field('post_name', $donation_dto->campaign->id)),
            'donation_amount' => $donation_dto->amount,
            'payment_method' => $donation_dto->payment_method->label ?? '',
            'payment_id' => $donation_dto->id,
            'tribute' => sprintf('%s %s %s', $donation_dto->tribute_type, $donation_dto->tribute_salutation, $donation_dto->tribute_to),
            'donation_date' => Date::format($donation_dto->created_at, DateTimeFormats::HUMAN_READABLE_DATE),
            'donor_name' => sprintf('%s %s', $donation_dto->donor->first_name, $donation_dto->donor->last_name),
        ];

        $campaign_dto = (new CampaignService())->get_by_id($donation_dto->campaign->id)->get_values();

        $campaign = [
            'campaign_title' => $campaign_dto->title,
            'campaign_creator' => $campaign_dto->author->display_name ?? '',
            'campaign_start_date' => Date::format($campaign_dto->start_date, DateTimeFormats::HUMAN_READABLE_DATE),
            'funded_percent' => CampaignGoal::goal_achieved_percentage($campaign_dto),
            'campaign_goal' => CampaignGoal::prepare_goal_for_display($campaign_dto->goal_type, $campaign_dto->goal_amount),
            'image' => $campaign_dto->images[0]['url'] ?? growfund_placeholder_image_url(),
            'campaign_url' => growfund_campaign_url($campaign_dto->slug),
            'backers_count' => $campaign_dto->number_of_contributors,
            'donors_count' => $campaign_dto->number_of_contributors,
            'fund_raised' => $campaign_dto->fund_raised,
        ];

        return parent::with([
            'donation_card' => growfund_renderer()->get_html('mails.components.donation-card', [
                'donation' => $donation
            ]),
            'campaign_funded_card' => growfund_renderer()->get_html('mails.components.campaign-funded-card', ['campaign' => $campaign]),
            'tribute' => growfund_settings(AppSettings::CAMPAIGNS)->allow_tribute()
                ? growfund_renderer()->get_html('mails.components.tribute', [
                    'tribute' => $donation['tribute']
                ])
                : '',
            'campaign_link_button' => growfund_renderer()->get_html('mails.components.link-button', [
                'text' => __('View Campaign', 'growfund-pro'),
                'link' => $campaign['campaign_url'],
                'colors' => $this->get_colors(),
            ]),
            'fundraiser_name' => $user->get_display_name(),
            'campaign_title' => $donation['campaign_title'],
            'campaign_url' => $donation['campaign_url'],
            'campaign_start_date' => $campaign['campaign_start_date'],
            'donation_amount' => $donation['donation_amount'],
            'donation_date' => $donation['donation_date'],
            'payment_method' => $donation['payment_method'],
            'payment_id' => $donation['payment_id'],
            'donor_name' => $donation['donor_name'],
        ]);
    }
}
