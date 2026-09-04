<?php

namespace GrowfundPro\Controllers\API;

use Growfund\Contracts\Request;
use Growfund\Exceptions\ValidationException;
use Growfund\Http\Response;
use Growfund\Sanitizer;
use Growfund\Validation\Validator;
use GrowfundPro\DTO\Collaborator\CreateCollaboratorDTO;
use GrowfundPro\Policies\CollaboratorPolicy;
use GrowfundPro\Services\CollaboratorService;

defined( 'ABSPATH' ) || exit;

class CollaboratorController {
    /**
     * Fundraiser service instance.
     *
     * @var CollaboratorService
     */
    protected $service;

    /**
     * CollaboratorPolicy instance.
     *
     * @var CollaboratorPolicy
     */
    protected $policy;

    /**
     * Initialize the controller with CollaboratorService.
     */
    public function __construct(CollaboratorService $service, CollaboratorPolicy $policy)
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

        $validator = Validator::make($data, CreateCollaboratorDTO::validation_rules());

        if ($validator->is_failed()) {
            throw ValidationException::with_errors($validator->get_errors()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- validation exception intentionally ignored
        }

        $sanitized_data = Sanitizer::make($data, CreateCollaboratorDTO::sanitization_rules())->get_sanitized_data();

        $fundraiser_dto = CreateCollaboratorDTO::from_array($sanitized_data);

        $collaborator_id = $this->service->store($fundraiser_dto);

        $response = [
            'data' => ['id' => (string) $collaborator_id],
            'message' => __('Collaborator created successfully.', 'growfund-pro'),
        ];

        return growfund_response()->json($response, Response::CREATED);
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
            ]),
            'message' => '',
        ]);
    }

    public function campaign_collaborators(Request $request) {
        return growfund_response()->json([
            'data' => $this->service->campaign_collaborators($request->get_int('campaign_id')),
            'message' => '',
        ]);
    }
}
