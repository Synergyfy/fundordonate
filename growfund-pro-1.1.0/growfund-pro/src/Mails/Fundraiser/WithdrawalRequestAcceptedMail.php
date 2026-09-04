<?php

namespace GrowfundPro\Mails\Fundraiser;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Mail\MailKeys;
use Growfund\Mailer;
use Growfund\Supports\Date;
use GrowfundPro\Services\WithdrawalService;
use InvalidArgumentException;

class WithdrawalRequestAcceptedMail extends Mailer
{
    protected $content_key = MailKeys::FUNDRAISER_WITHDRAWAL_REQUEST_ACCEPTED;

    public function with($data)
    {
        if (!isset($data['withdrawal_request_id'])) {
            throw new InvalidArgumentException(esc_html__('Withdrawal Request ID is required', 'growfund-pro'));
        }

        $withdrawal_service = new WithdrawalService();
        $withdrawal_request = $withdrawal_service->get_by_id((int) $data['withdrawal_request_id']);

        if (empty($withdrawal_request) || empty($withdrawal_request->fundraiser)) {
            $this->ignore_mail();
        }

        $this->to($withdrawal_request->fundraiser->email);

        return parent::with([
            'withdrawal_accepted_card' => growfund_renderer()->get_html(
                'mails.components.withdrawal-request.withdrawal-accepted-card', [
                    'withdrawal_request' => $withdrawal_request->get_values()->to_array()
                ]
            ),
            'fundraiser_name' => $withdrawal_request->fundraiser->display_name ?? '',
            'check_it_out_button' => growfund_renderer()->get_html('mails.components.link-button', [
                'text' => __('Pay Now', 'growfund'),
                'link' => growfund_url(
                    growfund_fundraiser_dashboard_url('#/wallet'), [
                        'withdrawal_request' => $withdrawal_request->id,
                    ]
                ),
                'colors' => $this->get_colors(),
            ]),
            'request_date' => Date::format($withdrawal_request->created_at),
        ]);
    }
}
