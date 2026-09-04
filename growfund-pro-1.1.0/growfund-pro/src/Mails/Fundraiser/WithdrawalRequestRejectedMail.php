<?php

namespace GrowfundPro\Mails\Fundraiser;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Mail\MailKeys;
use Growfund\Mailer;
use GrowfundPro\Services\WithdrawalService;
use InvalidArgumentException;

class WithdrawalRequestRejectedMail extends Mailer
{
    protected $content_key = MailKeys::FUNDRAISER_WITHDRAWAL_REQUEST_REJECTED;

    public function with($data)
    {
        if (!isset($data['withdrawal_request_id'])) {
            throw new InvalidArgumentException(esc_html__('Withdrawal Request ID is required', 'growfund-pro'));
        }

        $withdrawal_service = new WithdrawalService();
        $withdrawal_request = $withdrawal_service->get_by_id((int) $data['withdrawal_request_id']);

        if (empty($withdrawal_request)) {
            $this->ignore_mail();
        }

        $this->to($withdrawal_request->fundraiser->email);

        return parent::with([
            'withdrawal_rejected_card' => growfund_renderer()->get_html(
                'mails.components.withdrawal-request.withdrawal-rejected-card', [
                    'withdrawal_request' => $withdrawal_request->get_values()->to_array()
                ]
            ),
            'fundraiser_name' => $withdrawal_request->fundraiser->display_name ?? '',
        ]);
    }
}
