<?php

namespace GrowfundPro\Mails\Fundraiser;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\DateTimeFormats;
use Growfund\Constants\Mail\MailKeys;
use Growfund\Constants\Status\DonationStatus;
use Growfund\Mailer;
use Growfund\Services\DonationService;
use Growfund\Supports\Date;
use Growfund\Core\AppSettings;
use InvalidArgumentException;

class DonationCancelledMail extends Mailer
{
    protected $content_key = MailKeys::FUNDRAISER_DONATION_CANCELLED;

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

        if ($donation_dto->status !== DonationStatus::CANCELLED) {
            $this->ignore_mail();
        }

        $donation = [
            'campaign_title' => $donation_dto->campaign->title,
            'campaign_url' => growfund_campaign_url(get_post_field('post_name', $donation_dto->campaign->id)),
            'donation_amount' => $donation_dto->amount,
            'payment_method' => $donation_dto->payment_method->label ?? '',
            'tribute' => sprintf('%s %s %s', $donation_dto->tribute_type, $donation_dto->tribute_salutation, $donation_dto->tribute_to),
            'donor_name' => sprintf('%s %s', $donation_dto->donor->first_name, $donation_dto->donor->last_name),
            'donation_date' => Date::format($donation_dto->created_at, DateTimeFormats::HUMAN_READABLE_DATE),
            'payment_id' => $donation_dto->id,
        ];

        return parent::with([
            'donation_card' => growfund_renderer()->get_html('mails.components.donation-card', [
                'donation' => $donation
            ]),
            'tribute' => growfund_settings(AppSettings::CAMPAIGNS)->allow_tribute()
                ? growfund_renderer()->get_html('mails.components.tribute', [
                    'tribute' => $donation['tribute']
                ])
                : '',
            'fundraiser_name' => $user->get_display_name(),
            'campaign_title' => $donation['campaign_title'],
            'campaign_url' => $donation['campaign_url'],
            'donation_amount' => $donation['donation_amount'],
            'payment_method' => $donation['payment_method'],
            'donor_name' => $donation['donor_name'],
        ]);
    }
}
