<?php

namespace GrowfundPro\Controllers\API;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Tables;
use Growfund\Contracts\Request;
use Growfund\DTO\Fund\FundDTO;
use Growfund\Exceptions\ValidationException;
use Growfund\Http\Response;
use Growfund\Sanitizer;
use GrowfundPro\Services\FundService;
use Growfund\Supports\Arr;
use Growfund\Supports\Date;
use Growfund\Validation\Validator;
use GrowfundPro\Policies\FundPolicy;

/**
 * FundController class
 * @since 1.0.0
 */
class FundController
{
    /**
     * @var FundService
     */
    protected $service;

    /**
     * @var FundPolicy
     */
    protected $policy;

    /**
     * Initialize the controller with FundService.
     */
    public function __construct(FundService $service, FundPolicy $policy)
    {
        $this->service = $service;
        $this->policy = $policy;
    }

    /**
     * Get paginated funds
     * @param \Growfund\Contracts\Request $request
     * @return \Growfund\Http\Response
     */
    public function paginated(Request $request)
    {
        $this->policy->authorize_paginated();

        $funds = $this->service->paginated([
            'page' => $request->get_int('page'),
            'limit' => $request->get_int('per_page'),
            'search' => $request->get_string('search'),
            'orderby' => $request->get_column('orderby', 'ID', ['ID', 'title', 'description', 'created_at', 'updated_at']),
            'order' => $request->get_string('order'),
            'status' => $request->get_string('status'),
        ]);

        return growfund_response()->json([
            'data' => $funds,
            'message' => '',
        ]);
    }

    /**
     * Get all the funds without any pagination
     *
     * @return Response
     */
    public function all()
    {
        $funds = $this->service->all();

        return growfund_response()->json([
            'data' => $funds,
            'message' => '',
        ]);
    }

    /**
     * Create a new fund
     * @param \Growfund\Contracts\Request $request
     * @return \Growfund\Http\Response
     */
    public function create(Request $request)
    {
        $this->policy->authorize_create();

        $data = $request->all();

        $validator = Validator::make($data, FundDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($data, FundDTO::sanitization_rules())
            ->get_sanitized_data();

        $fund_dto = FundDTO::from_array($sanitized_data);

        $fund_id = $this->service->store($fund_dto);

        $response = [
            'data' => ['id' => (string) $fund_id],
            'message' => __('Fund created successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::CREATED);
    }

    /**
     * Update existing fund
     * @param \Growfund\Contracts\Request $request
     * @return \Growfund\Http\Response
     */
    public function update(Request $request)
    {
        $this->policy->authorize_update($request->get_int('id'));

        $data = $request->all();

        $validator = Validator::make($data, FundDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($data, FundDTO::sanitization_rules())
            ->get_sanitized_data();

        $fund_dto = FundDTO::from_array($sanitized_data);

        $fund_id = $request->get_int('id');

        $is_updated = $this->service->update($fund_id, $fund_dto);

        $response = [
            'data' => $is_updated,
            'message' => __('Fund updated successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /**
     * Get fund by id
     * @param \Growfund\Contracts\Request $request
     * @return \Growfund\Http\Response 
     */
    public function get_by_id(Request $request)
    {
        $this->policy->authorize_get_by_id($request->get_int('id'));

        $fund_dto = $this->service->get_by_id($request->get_int('id'));

        $response = [
            'data' => $fund_dto->exclude(['is_default']),
            'message' => '',
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /**
     * Retrieve fund details by ID.
     *
     * Validates the request to ensure the fund ID exists and is an integer.
     * If validation passes, fetches detailed information of the fund.
     *
     * @param Request $request The HTTP request instance containing the fund ID.
     * @return Response JSON response with the fund details.
     * @throws ValidationException If validation fails.
     */
    public function details(Request $request)
    {
        $this->policy->authorize_details($request->get_int('id'));

        $validator = Validator::make($request->all(), [
            'id' => 'integer|required|exists:' . Tables::FUNDS . ',ID',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $start_date = $request->get_date('start_date');
        $end_date = $request->get_date('end_date');

        if (empty($start_date) && empty($end_date)) {
            list($start_date, $end_date) = Date::start_and_end_date_of_last_thirty_days();
        }

        if (empty($end_date)) {
            $end_date = $start_date;
        }

        $fund_details_dto = $this->service->details($request->get_int('id'), $start_date, $end_date);

        $response = [
            'data' => $fund_details_dto,
            'message' => '',
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /**
     * Delete existing fund
     * @param \Growfund\Http\Request $request
     * @return \Growfund\Http\Response
     */
    public function delete(Request $request)
    {
        $this->policy->authorize_delete($request->get_int('id'));

        $id = $request->get_int('id');
        $is_deleted = $this->service->delete($id);

        $response = [
            'data' => $is_deleted,
            'message' => __('Fund deleted successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /**
     * Handle bulk actions
     * 
     * @param \Growfund\Contracts\Request $request
     * @return Response
     */
    public function bulk_actions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids'       => 'required|array',
            'action'    => 'required|string|in:trash,restore,delete',
        ]);

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $this->policy->authorize_bulk_actions($request->get_array('ids'));

        $result = [];

        switch ($request->get_string('action')) {
            case 'trash':
                $result = $this->service->bulk_delete($request->get_array('ids'), false);
                break;
            case 'delete':
                $result = $this->service->bulk_delete($request->get_array('ids'), true);
                break;
            case 'restore':
                $result = $this->service->bulk_restore($request->get_array('ids'));
                break;
        }


        $failed = empty($result['failed']) ? [] : Arr::make($result['failed'])->pluck('id')->toArray();

        $message = empty($failed)
            ?  __('Bulk action successfully applied for all the selected funds.', 'growfund-pro')
            : sprintf(
                /* translators: %s: fund ids */
                __('Bulk action successfully applied for all the selected funds except the funds with id: %s.', 'growfund-pro'),
                implode(', ', $failed)
            );

        return growfund_response()->json([
            'data' => $result,
            'message' => $message,
        ], Response::MULTI_STATUS);
    }

    /**
     * Empty soft deleted funds
     *
     * @return Response
     */
    public function empty_trash()
    {
        $this->policy->authorize_empty_trash();

        $is_deleted = $this->service->empty_trash(growfund_user()->get_id());

        if (!$is_deleted) {
            return growfund_response()->json([
                'data' => $is_deleted,
                'message' => __('Failed to empty trash', 'growfund-pro'),
            ], Response::INTERNAL_SERVER_ERROR);
        }

        return growfund_response()->json([
            'data' => $is_deleted,
            'message' => __('Trash emptied successfully', 'growfund-pro'),
        ]);
    }
}
