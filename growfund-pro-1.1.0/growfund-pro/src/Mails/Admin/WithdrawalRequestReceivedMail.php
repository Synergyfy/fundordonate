<?php

namespace GrowfundPro\Mails\Admin;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Mail\MailKeys;
use Growfund\Mailer;
use Growfund\Supports\AdminUser;
use GrowfundPro\Services\WithdrawalService;
use InvalidArgumentException;

class WithdrawalRequestReceivedMail extends Mailer
{
    protected $content_key = MailKeys::ADMIN_WITHDRAWAL_REQUEST_RECEIVED;

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

        $admin = growfund_user(AdminUser::get_id());

        $this->to($admin->get_email());

        return parent::with([
            'withdrawal_details_table' => growfund_renderer()->get_html(
                'mails.components.withdrawal-request.withdrawal-detail-table', [
                    'withdrawal_request' => $withdrawal_request->get_values()->to_array()
                ]
            ),
            'admin_name' => $admin->get_display_name(),
            'fundraiser_name' => $withdrawal_request->fundraiser->display_name ?? '',
            'pay_now_button' => growfund_renderer()->get_html('mails.components.link-button', [
                'text' => __('Pay Now', 'growfund'),
                'link' => growfund_url(
                    admin_url('admin.php?page=growfund#/withdrawal-request'), [
                        'withdrawal_request' => $withdrawal_request->id,
                        'pay_now' => true
                    ]
                ),
                'colors' => $this->get_colors(),
            ]),
        ]);
    }
}
