<?php

namespace GrowfundPro\Mails\Donor;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Mail\MailKeys;
use Growfund\Constants\Campaign\TributeNotificationType;
use Growfund\Core\AppSettings;
use Growfund\Mailer;
use Growfund\Services\CampaignService;
use Growfund\Services\DonationService;
use InvalidArgumentException;

class TributeMail extends Mailer
{
    protected $content_key = MailKeys::DONOR_TRIBUTE_MAIL;

    public function with($data)
    {
        if (!isset($data['donation_id'])) {
            throw new InvalidArgumentException(esc_html__('Donation ID is required', 'growfund-pro'));
        }

        $donation_dto = (new DonationService())->get_by_id($data['donation_id'])->get_values();
        $campaign_dto = (new CampaignService())->get_by_id($donation_dto->campaign->id)->get_values();

        if (
            !growfund_settings(AppSettings::CAMPAIGNS)->allow_tribute()
            || !$campaign_dto->has_tribute
            || empty($donation_dto->tribute_type)
            || empty($donation_dto->tribute_notification_recipient_email)
            || !in_array(
                $donation_dto->tribute_notification_type,
                [TributeNotificationType::ECARD, TributeNotificationType::BOTH],
                true
            )
        ) {
            return $this->ignore_mail();
        }

        $this->to($donation_dto->tribute_notification_recipient_email);

        $ecard_url = growfund_ecard_download_url($donation_dto->uid);
        $campaign_url = growfund_campaign_url(get_post_field('post_name', $donation_dto->campaign->id));

        return parent::with([
            'notification_receiver_name' => $donation_dto->tribute_notification_recipient_name,
            'tribute' => growfund_settings(AppSettings::CAMPAIGNS)->allow_tribute()
                ? growfund_renderer()->get_html('mails.components.tribute', [
                    'tribute' => sprintf('%s %s %s', $donation_dto->tribute_type, $donation_dto->tribute_salutation, $donation_dto->tribute_to),
                ])
                : '',
            'tribute_to' => sprintf('%s %s', $donation_dto->tribute_salutation, $donation_dto->tribute_to),
            'donation_amount_card' => growfund_renderer()->get_html('mails.components.donor.donation-amount-card', [
                'donation' => [
                    'campaign_title' => $donation_dto->campaign->title,
                    'campaign_url' => $campaign_url,
                    'donation_amount' => $donation_dto->amount,
                ]
            ]),
            'download_ecard_button' => growfund_renderer()->get_html('mails.components.link-button', [
                'text' => __('Download Ecard', 'growfund'),
                'link' => $ecard_url,
                'colors' => $this->get_colors(),
            ]),
            'donation_amount' => $donation_dto->amount,
            'campaign_title' => $donation_dto->campaign->title,
            'campaign_url' => $campaign_url,
        ]);
    }
}
