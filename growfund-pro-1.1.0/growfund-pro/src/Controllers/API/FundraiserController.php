<?php

namespace GrowfundPro\Controllers\API;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Activities;
use Growfund\Constants\Status\FundraiserStatus;
use Growfund\Constants\UserDeleteType;
use Growfund\Contracts\Request;
use Growfund\DTO\Activity\ActivityFilterDTO;
use Growfund\Exceptions\ValidationException;
use Growfund\Http\Response;
use Growfund\Sanitizer;
use GrowfundPro\Services\FundraiserService;
use Growfund\DTO\Fundraiser\CreateFundraiserDTO;
use Growfund\DTO\Fundraiser\UpdateFundraiserDTO;
use GrowfundPro\DTO\Fundraiser\PayoutMethodDTO;
use Growfund\Services\ActivityService;
use Growfund\Supports\Arr;
use Growfund\Validation\Validator;
use Growfund\Constants\UserTypes\Fundraiser;
use GrowfundPro\Policies\FundraiserPolicy;
use Exception;
use Growfund\Supports\Date;
use Growfund\Supports\UserMeta;

/**
 * Class FundraiserController
 * @since 1.0.0
 */
class FundraiserController
{
    /**
     * Fundraiser service instance.
     *
     * @var FundraiserService
     */
    protected $service;

    /**
     * FundraiserPolicy instance.
     *
     * @var FundraiserPolicy
     */
    protected $policy;

    /**
     * Initialize the controller with FundraiserService.
     */
    public function __construct(FundraiserService $service, FundraiserPolicy $policy)
    {
        $this->service = $service;
        $this->policy = $policy;
    }

    /**
     * Create new fundraiser
     * @param Request $request
     * @return Response
     */
    public function create(Request $request)
    {
        $this->policy->authorize_create();

        $data = $request->all();

        $validator = Validator::make($data, CreateFundraiserDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($data, CreateFundraiserDTO::sanitization_rules())->get_sanitized_data();

        $fundraiser_dto = CreateFundraiserDTO::from_array($sanitized_data);

        $fundraiser_id = $this->service->store($fundraiser_dto);

        $response = [
            'data' => ['id' => (string) $fundraiser_id],
            'message' => __('Fundraiser created successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::CREATED);
    }

    public function make_fundraiser(Request $request) {
        $this->policy->authorize_create();

        $user_id = $request->get_int('user_id');

        $user = growfund_user($user_id);

        if ($user->is_fundraiser()) {
            throw new Exception(esc_html__('User is already a fundraiser.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }
        
        $is_role_added = $user->add_new_role(Fundraiser::ROLE);
        UserMeta::update($user->get_id(), 'joined_at', Date::current_sql_safe());
        UserMeta::update($user->get_id(), 'status', FundraiserStatus::ACTIVE );

        return growfund_response()->json([
            'data' => $is_role_added,
            'message' => __('Made fundraiser successfully', 'growfund-pro'),
        ], Response::OK);
    }

    /**
     * Update existing fundraiser
     * @param Request $request
     * @return Response
     */
    public function update(Request $request)
    {
        $fundraiser_id = $request->get_int('id');

        if (! growfund_user($fundraiser_id)->is_fundraiser()) {
            throw new Exception(esc_html__('Invalid fundraiser ID.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $this->policy->authorize_update($request->get_int('id'));

        $data = $request->all();

        $validator = Validator::make($data, UpdateFundraiserDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($data, UpdateFundraiserDTO::sanitization_rules())->get_sanitized_data();

        $fundraiser_id = $request->get_int('id');

        $fundraiser_dto = UpdateFundraiserDTO::from_array($sanitized_data);

        $result = $this->service->update($fundraiser_id, $fundraiser_dto);

        $response = [
            'data' => $result,
            'message' => __('Fundraiser updated successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /**
     * Update fundraiser payout payment method
     * @param Request $request
     * @return Response
     */
    public function update_payout_method(Request $request)
    {
        $fundraiser_id = $request->get_int('id');

        if (!growfund_user($fundraiser_id)->has_active_role(Fundraiser::ROLE)) {
            throw new Exception(esc_html__('Invalid fundraiser ID.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $this->policy->authorize_update($fundraiser_id);

        $validator = Validator::make($request, PayoutMethodDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($request, PayoutMethodDTO::sanitization_rules())->get_sanitized_data();
        
        $payout_dto = PayoutMethodDTO::from_array($sanitized_data);

        $result = $this->service->update_payout_method($fundraiser_id, $payout_dto);

        $response = [
            'data' => $result,
            'message' => __('Payout payment method updated successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /** 
     * Return a paginated list of fundraisers.
     *
     * @param Request $request
     * @return \Growfund\Http\Response
     */
    public function paginated(Request $request)
    {
        $this->policy->authorize_paginated();

        return growfund_response()->json([
            'data' => $this->service->paginated([
                'page' => $request->get_int('page', 1),
                'limit' => $request->get_int('per_page', 10),
                'orderby' => $request->get_column('orderby', 'ID', ['ID', 'user_email']),
                'order' => $request->get_string('order', 'DESC'),
                'search' => $request->get_string('search'),
                'status' => $request->get_string('status'),
            ]),
            'message' => '',
        ]);
    }

    /**
     * Update fundraiser status
     *
     * @param Request $request
     * @return Response
     */
    public function update_status(Request $request)
    {
        $fundraiser_id = $request->get_int('id');

        if (! growfund_user($fundraiser_id)->is_fundraiser()) {
            throw new Exception(esc_html__('Invalid fundraiser ID.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $this->policy->authorize_update_status($fundraiser_id);

        $validator = Validator::make($request->all(), [
            'id'       => 'required',
            'action'   => 'required|string|in:approve,decline',
            'reason'   => 'prohibited_if:action,approve|required_if:action,decline|string',
        ]);

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $status = $request->get_string('action') === 'approve' ? FundraiserStatus::ACTIVE : FundraiserStatus::INACTIVE;
        $reason =  $request->get_string('reason');

        $is_updated = $this->service->update_status($fundraiser_id, $status, $reason);

        return growfund_response()->json([
            'data' => $is_updated,
            'message' => __('Fundraiser status updated successfully', 'growfund-pro'),
        ]);
    }

    /**
     * Delete fundraiser
     * @param Request $request
     * @return Response
     */
    public function delete(Request $request)
    {
        $id = $request->get_int('id');

        if (! growfund_user($id)->is_fundraiser()) {
            throw new Exception(esc_html__('Invalid fundraiser ID.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $this->policy->authorize_delete($id);

        $delete_type = growfund_user()->get_id() === $id ? UserDeleteType::ANONYMIZE : UserDeleteType::TRASH;

        $is_deleted = $this->service->delete($id, $delete_type);

        $response = [
            'data' => $is_deleted,
            'message' => __('Fundraiser deleted successfully', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::OK);
    }

    /**
     * Empty soft fundraiser
     *
     * @return Response
     */
    public function empty_trash(Request $request)
    {
        $this->policy->authorize_empty_trash();

        $is_deleted = $this->service->empty_trash($request->get_bool('is_permanent_delete'));

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

    /**
     * Handle bulk actions
     * 
     * @param \Growfund\Contracts\Request $request
     * @return Response
     */
    public function bulk_actions(Request $request)
    {
        $this->policy->authorize_bulk_actions();

        $validator = Validator::make($request->all(), [
            'ids'       => 'required|array',
            'action'    => 'required|string|in:trash,delete,restore',
            'is_permanent_delete' => 'required_if:action,delete|boolean',
        ]);

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $result = [];

        switch ($request->get_string('action')) {
            case 'trash':
                $result = $this->service->bulk_delete($request->get_array('ids'), UserDeleteType::TRASH);
                break;
            case 'delete':
                $type = $request->get_bool('is_permanent_delete', false) ? UserDeleteType::PERMANENT : UserDeleteType::ANONYMIZE;
                $result = $this->service->bulk_delete($request->get_array('ids'), $type);
                break;
            case 'restore':
                $result = $this->service->bulk_restore($request->get_array('ids'));
                break;
        }


        $failed = empty($result['failed']) ? [] : Arr::make($result['failed'])->pluck('id')->toArray();

        $message = empty($failed)
            ? __('Bulk action successfully applied for all the selected fundraiser.', 'growfund-pro')
            : sprintf(
                /* translators: %s: fundraiser ids */
                __('Bulk action successfully applied for all the selected fundraiser except the fundraiser with id: %s.', 'growfund-pro'),
                implode(', ', $failed)
            );

        return growfund_response()->json([
            'data' => $result,
            'message' => $message,
        ], Response::MULTI_STATUS);
    }

    /**
     * Get fundraiser overview
     * @return Response
     */
    public function overview(Request $request)
    {
        $fundraiser_id = $request->get_int('id');

        if (! growfund_user($fundraiser_id)->is_fundraiser()) {
            throw new Exception(esc_html__('Invalid fundraiser ID.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $this->policy->authorize_overview($fundraiser_id);

        return growfund_response()->json([
            'data' => $this->service->get_overview($fundraiser_id),
            'message' => '',
        ]);
    }

    public function activities(Request $request)
    {
        $fundraiser_id = $request->get_int('id');

        if (! growfund_user($fundraiser_id)->is_fundraiser()) {
            throw new Exception(esc_html__('Invalid fundraiser ID.', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $activity_filter_dto = ActivityFilterDTO::from_array([
            'page' => $request->get_int('page', 1),
            'limit' => $request->get_int('per_page', 10),
            'orderby' => $request->get_column('orderby', 'created_at', ['ID', 'type', 'created_at']),
            'order' => $request->get_string('order', 'DESC'),
            'user_id' => $fundraiser_id,
        ]);

        $activities = (new ActivityService())->paginated($activity_filter_dto, Activities::FUNDRAISER);

        return growfund_response()->json([
            'data' => $activities,
            'message' => '',
        ]);
    }
}
