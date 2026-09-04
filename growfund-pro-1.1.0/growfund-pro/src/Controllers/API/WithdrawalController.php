<?php

namespace GrowfundPro\Controllers\API;

defined( 'ABSPATH' ) || exit;

use Exception;
use Growfund\Constants\UserTypes\Admin;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Contracts\Request;
use Growfund\Exceptions\ValidationException;
use Growfund\Http\Response;
use Growfund\Sanitizer;
use Growfund\Supports\FileHandler;
use GrowfundPro\Services\WithdrawalService;
use Growfund\Validation\Validator;
use GrowfundPro\Policies\WithdrawalRequestPolicy;
use GrowfundPro\Constants\WithdrawalRequestStatus;
use GrowfundPro\DTO\WithdrawalRequest\CreateWithdrawalRequestDTO;
use GrowfundPro\DTO\WithdrawalRequest\UpdateWithdrawalRequestDTO;
use GrowfundPro\DTO\WithdrawalRequest\WithdrawalFilterDTO;

/**
 * Class WithdrawalController
 * @since 1.1.0
 */
class WithdrawalController
{
    /**
     * Withdrawal Request service instance.
     *
     * @var WithdrawalService
     */
    protected $service;

    /**
     * WithdrawalRequestPolicy instance.
     *
     * @var WithdrawalRequestPolicy
     */
    protected $policy;

    /**
     * Initialize the controller with WithdrawalService.
     */
    public function __construct(WithdrawalService $service, WithdrawalRequestPolicy $policy)
    {
        $this->service = $service;
        $this->policy = $policy;
    }

    /**
     * Create new withdrawal request
     * @param Request $request
     * @return Response
     */
    public function create(Request $request)
    {
        $this->policy->authorize_create();

        $validator = Validator::make($request, CreateWithdrawalRequestDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $dto = CreateWithdrawalRequestDTO::from_array([
            'amount' => $request->get_money('amount'),
        ]);

        $withdrawal_id = $this->service->store($dto);

        $response = [
            'data' => ['id' => (string) $withdrawal_id],
            'message' => __('Withdrawal request created successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::CREATED);
    }

    /** 
     * Return a paginated list of withdrawal requests.
     *
     * @param Request $request
     * @return \Growfund\Http\Response
     */
    public function paginated(Request $request)
    {
        $this->policy->authorize_paginated();

        return growfund_response()->json([
            'data' => $this->service->paginated(WithdrawalFilterDTO::from_array([
                'page' => $request->get_int('page', 1),
                'limit' => $request->get_int('per_page', 10),
                'orderby' => $request->get_column('orderby', 'ID', ['ID', 'status', 'created_at']),
                'order' => $request->get_string('order', 'DESC'),
                'search' => $request->get_string('search'),
                'status' => $request->get_string('status'),
                'method' => $request->get_string('method'),
                'start_date' => $request->get_date('start_date'), 
				'end_date' => $request->get_date('end_date'),  
                'user_id' => growfund_user()->has_active_role(Fundraiser::ROLE) 
                    ? growfund_user()->get_id() 
                    : $request->get_int('user_id'),
            ])),
            'message' => '',
        ]);
    }

    /**
     * Update withdrawal request status
     *
     * @param Request $request
     * @return Response
     */
    public function update_status(Request $request)
    {
        $this->policy->authorize_update();

        $validator = Validator::make($request, UpdateWithdrawalRequestDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($request, UpdateWithdrawalRequestDTO::sanitization_rules())
            ->get_sanitized_data();

        $update_dto = UpdateWithdrawalRequestDTO::from_array($sanitized_data);
        $withdrawal_request = $this->service->get_by_id($update_dto->id);

        if (empty($withdrawal_request)) {
            throw new Exception(
                esc_html__('Withdrawal request not found', 'growfund-pro'),
                (int) Response::NOT_FOUND
            );
        }

        if ($withdrawal_request->status !== WithdrawalRequestStatus::PENDING) {
            throw new Exception(
                esc_html__('Withdrawal request has already been processed', 'growfund-pro'),
                (int) Response::UNPROCESSABLE_ENTITY
            );
        }

        $update_dto->status = $update_dto->action === 'approve' 
            ? WithdrawalRequestStatus::APPROVED 
            : WithdrawalRequestStatus::REJECTED;

        $is_updated = $this->service->update_status($withdrawal_request, $update_dto);

        return growfund_response()->json([
            'data' => $is_updated,
            'message' => __('Withdrawal request updated successfully', 'growfund-pro'),
        ]);
    }

    public function download_invoice(Request $request) {
        $withdrawal_request = $this->service->get_by_id($request->get_int('id'));

        if (empty($withdrawal_request)) {
            throw new Exception(
                esc_html__('Withdrawal request not found', 'growfund-pro'),
                (int) Response::NOT_FOUND
            );
        }

        if (
            growfund_user()->get_id() !== $withdrawal_request->fundraiser->id 
            && !growfund_user()->has_active_role(Admin::ROLE)
        ) {
            throw new Exception(
                esc_html__('You do not have permission for this action', 'growfund-pro'),
                (int) Response::UNAUTHORIZED
            );
        }

        if (empty($withdrawal_request->attachment)) {
            throw new Exception(
                esc_html__('Invoice not found', 'growfund-pro'),
                (int) Response::NOT_FOUND
            );
        }

        (new FileHandler())->download($withdrawal_request->attachment, 'invoice_' . $withdrawal_request->id);
        exit;
    }
}
