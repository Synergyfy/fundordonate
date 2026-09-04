<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Activities;
use Growfund\Constants\MetaKeys\Fundraiser as MetaKeysFundraiser;
use Growfund\Constants\Status\FundraiserStatus;
use Growfund\Constants\UserDeleteType;
use Growfund\Supports\Pagination as PaginationSupport;
use Growfund\Supports\Paginator;
use Growfund\Supports\UserMeta;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\DTO\Activity\ActivityFilterDTO;
use Growfund\DTO\Fundraiser\FundraiserDTO;
use Growfund\DTO\Fundraiser\FundraiserListItemDTO;
use Growfund\DTO\Fundraiser\FundraiserOverviewDTO;
use GrowfundPro\DTO\Fundraiser\PayoutMethodDTO;
use Growfund\Http\Response;
use Growfund\Supports\Arr;
use Growfund\Supports\Date;
use Growfund\Supports\User as UserSupport;
use Exception;
use Growfund\DTO\PaginatedCollectionDTO;
use Growfund\DTO\User\UserInfoDTO;
use Growfund\Mails\Fundraiser\AccountApprovedMail;
use Growfund\Mails\Fundraiser\AccountDeclinedMail;
use Growfund\Services\ActivityService;
use Growfund\Services\DonationService;
use Growfund\Services\PledgeService;
use Growfund\Services\UserService;
use Growfund\Supports\FileHandler;
use Growfund\Supports\MediaAttachment;
use WP_User;
use WP_User_Query;

class FundraiserService extends UserService
{
    /**
     * Get paginated list of backers.
     *
     * @param array $params Associative array containing:
     *   - int    'limit'       Number of results per page.
     *   - int    'page'        Current page number.
     *   - string 'search'      Search keyword.
     *   - string 'orderby'     Order by field.
     *   - string 'order'       ASC | DESC.
     *   - string 'status'      Fundraiser status.
     *
     * @return PaginatedCollectionDTO
     */
    public function paginated(array $params)
    {
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $orderby = isset($params['orderby']) ? $params['orderby'] : 'ID';
        $order = isset($params['order']) ? $params['order'] : 'DESC';
        $search = !empty($params['search']) ? $params['search'] : '';
        $status = !empty($params['status']) ? $params['status'] : 'all';

        $query_args = [
            'count_total'    => true,
            'number'         => $limit,
            'paged'          => $page,
            'search'         => '*' . $search . '*',
            'search_columns' => ['ID', 'user_login', 'user_email', 'user_nicename'],
            'orderby'        => $orderby,
            'order'          => strtoupper($order),
            'role'           => Fundraiser::ROLE,
        ];

        if ($status !== 'trashed') {
            $query_args['meta_query'][] = [
                'relation' => 'OR',
                [
                    'key'     => growfund_with_prefix(UserSupport::SOFT_DELETE_KEY),
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key'     => growfund_with_prefix(UserSupport::SOFT_DELETE_KEY),
                    'value'   => '1',
                    'compare' => '!=',
                ],
            ];

            $query_args['meta_query'][] = [
                'relation' => 'OR',
                [
                    'key'     => growfund_with_prefix(UserSupport::IS_ANONYMIZED),
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key'     => growfund_with_prefix(UserSupport::IS_ANONYMIZED),
                    'value'   => '1',
                    'compare' => '!=',
                ],
            ];
        } elseif ($status === 'trashed') {
            $query_args['meta_query'][] = [
                [
                    'key'     => growfund_with_prefix(UserSupport::SOFT_DELETE_KEY),
                    'value'   => '1',
                ],
            ];

            $query_args['meta_query'][] = [
                'relation' => 'OR',
                [
                    'key'     => growfund_with_prefix(UserSupport::IS_ANONYMIZED),
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key'     => growfund_with_prefix(UserSupport::IS_ANONYMIZED),
                    'value'   => '1',
                    'compare' => '!=',
                ],
            ];
        }

        if ($status === FundraiserStatus::ACTIVE) {
            $query_args['meta_query'][] = [
                'key'     => growfund_with_prefix('status'),
                'value'   => FundraiserStatus::ACTIVE,
                'compare' => '=',
            ];
        }
        if ($status === FundraiserStatus::INACTIVE) {
            $query_args['meta_query'][] = [
                'key'     => growfund_with_prefix('status'),
                'value'   => FundraiserStatus::INACTIVE,
                'compare' => '=',
            ];
        }



        if ($status === FundraiserStatus::PENDING) {
            $query_args['meta_query'][] = [
                'key'     => growfund_with_prefix('status'),
                'value'   => FundraiserStatus::PENDING,
                'compare' => '=',
            ];
        }

        // Filter by start date
        if (!empty($params['start_date'])) {
            $query_args['meta_query'][] = [
                'key'     => growfund_with_prefix('joined_at'),
                'value'   => $params['start_date'],
                'compare' => '>=',
                'type'    => 'DATE'
            ];
        }

        // Filter by end date
        if (!empty($params['end_date'])) {
            $query_args['meta_query'][] = [
                'key'     => growfund_with_prefix('joined_at'),
                'value'   => $params['end_date'],
                'compare' => '<=',
                'type'    => 'DATE'
            ];
        }

        // Ensure meta_query uses AND logic only if more than one condition exists
        if (!empty($query_args['meta_query']) && count($query_args['meta_query']) > 1) {
            $query_args['meta_query']['relation'] = 'AND';
        }

        if (growfund_user()->is_fundraiser()) {
            $query_args['exclude'] = [growfund_user()->get_id()]; // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
        }

        $query = new WP_User_Query($query_args);

        $results = [];

        $users = $query->get_results();

        if (!empty($users)) {
            foreach ($users as $user) {
                $fundraiser = $this->format_data($user);
                $dto = FundraiserListItemDTO::from_array($fundraiser->all());
                $dto->total_campaign_created = $this->get_total_campaigns_created($user->ID);

                $results[] = $dto;
            }
        }

        $total = $query->get_total();
        $overall = PaginationSupport::get_overall_user_count(Fundraiser::ROLE);

        return PaginatedCollectionDTO::from_array(Paginator::make_metadata(
            $results,
            (int) $limit,
            (int) $page,
            $total,
            $overall
        ));
    }

    /**
     * Get fundraiser by ID.
     * 
     * @param int $id Fundraiser ID.
     * 
     * @return FundraiserDTO
     */
    public function get_by_id(int $id)
    {
        $fundraiser = growfund_user($id);

        if (empty($fundraiser->get())) {
            throw new Exception(esc_html__('Fundraiser not found', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        return $this->format_data($fundraiser->get());
    }

    /**
     * Format fundraiser data into API-friendly schema.
     *
     * @param \WP_User $user WordPress fundraiser object.
     * @return FundraiserDTO.
     */
    protected function format_data($user)
    {
        $decline_reasons = UserMeta::get($user->ID, 'decline_reasons', false) ?? [];

        $dto = new FundraiserDTO();

        $dto->id                    = (string) $user->ID;
        $dto->first_name            = $user->first_name ?? '';
        $dto->last_name             = $user->last_name ?? '';
        $dto->email                 = $user->user_email;
        $dto->username              = $user->user_login;
        $dto->phone                 = UserSupport::get_phone_number($user->ID);
        $dto->image                 = UserSupport::get_avatar_image($user->ID);
        $dto->joined_at             = UserSupport::get_joined_date($user) ?? '';
        $dto->status                = UserSupport::get_status($user->ID) ?? FundraiserStatus::PENDING;
        $dto->decline_reason        = !empty($decline_reasons) && is_array($decline_reasons) ? end($decline_reasons) : '';
        $dto->is_verified           = UserSupport::is_verified($user);
        $dto->created_by            = UserSupport::get_created_by($user->ID);

        return $dto;
    }

    /**
     * Retrieve fundraisers to send mail.
     *
     * @param int|null $campaign_id Campaign ID.
     * @param int|null $fundraiser_id Campaign fundraiser ID.
     *
     * @return array<int,object> Array of fundraiser objects with 'id', 'email', and 'display_name' properties.
     */
    public function get_fundraisers_to_send_mail($campaign_id = null, $fundraiser_id = null)
    {
        if (empty($campaign_id) || empty($fundraiser_id)) {
            return [];
        }

        $query_args = [
            'number'         => -1,
            'orderby'        => 'display_name',
            'order'          => 'ASC',
            'fields'         => ['ID', 'display_name', 'user_email'],
            'role'           => Fundraiser::ROLE,
            'include'        => [$fundraiser_id]
        ];

        $query_args['meta_query'][] = [
            'relation' => 'OR',
            [
                'key'     => growfund_with_prefix(UserSupport::SOFT_DELETE_KEY),
                'compare' => 'NOT EXISTS',
            ],
            [
                'key'     => growfund_with_prefix(UserSupport::SOFT_DELETE_KEY),
                'value'   => '1',
                'compare' => '!=',
            ],
        ];

        $query_args['meta_query'][] = [
            'relation' => 'OR',
            [
                'key'     => growfund_with_prefix(UserSupport::IS_ANONYMIZED),
                'compare' => 'NOT EXISTS',
            ],
            [
                'key'     => growfund_with_prefix(UserSupport::IS_ANONYMIZED),
                'value'   => '1',
                'compare' => '!=',
            ],
        ];

        $query_args['meta_query'][] = [
            'key'     => growfund_with_prefix('status'),
            'value'   => FundraiserStatus::ACTIVE,
            'compare' => '=',
        ];

        $query_args['meta_query']['relation'] = 'AND';

        $query = new WP_User_Query($query_args);

        $users = $query->get_results();

        return Arr::make($users)->map(function ($user) {
            return (object) [
                'id' => $user->ID,
                'email' => $user->user_email,
                'display_name' => $user->display_name
            ];
        })->toArray();
    }

    /**
     * Update an existing fundraiser's status.
     *
     * @param int $id The ID of the fundraiser post.
     * @param string $status The status of the fundraiser post.
     * @param string $decline_reason The reason to decline fundraiser.
     * 
     * @return bool True if successfully updated the fundraiser status or false.
     * 
     * @throws Exception If the post could not be found.
     */
    public function update_status(int $id, string $status, $decline_reason = null)
    {
        $user = growfund_user($id);

        if (!$user->is_fundraiser()) {
            /* translators: %s: fundraiser id */
            throw new Exception(sprintf(esc_html__('Fundraiser with ID %s not found.', 'growfund-pro'), esc_html($id)));
        }

        if (!empty($decline_reason)) {
            UserMeta::add($id, 'decline_reasons', [
                'user_id' => get_current_user_id(),
                'message' => $decline_reason,
                'created_at' => Date::current_sql_safe(),
            ]);
        }

        $fundraiser = UserMeta::update_many($id, [
            MetaKeysFundraiser::STATUS => $status,
            MetaKeysFundraiser::JOINED_AT => $status === FundraiserStatus::ACTIVE ? Date::current_sql_safe() : null,
        ]);

        $is_updated = !empty($fundraiser);

        if ($is_updated) {
			growfund_scheduler()
                ->resolve($status === FundraiserStatus::ACTIVE ? AccountApprovedMail::class : AccountDeclinedMail::class)
                ->with(['user_id' => $id])
                ->group('growfund_user_emails')
                ->schedule_email();
        }

        return $is_updated;
    }

    /**
     * Delete a fundraiser by id.
     * 
     * @param int $id Fundraiser id.
     * @param string $type Whether to delete permanently or just mark as deleted or anonymize.
     * @return bool True if delete was successful, false otherwise.
     * @throws Exception If backer not found.
     */
    public function delete(int $id, $type = null)
    {
        $fundraiser = get_user_by('ID', $id);

        if (!$fundraiser || !in_array(Fundraiser::ROLE, $fundraiser->roles, true)) {
            throw new Exception(esc_html__('Fundraiser not found', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        parent::delete($id, $type);

        return true;
    }

    /**
     * Delete all the trashed fundraisers.
     * 
     * @param bool $is_permanent_delete
     * @return bool
     */
    public function empty_trash($is_permanent_delete = false)
    {
        $users = get_users([
            'role'       => Fundraiser::ROLE,
            'meta_key'   => growfund_with_prefix(UserSupport::SOFT_DELETE_KEY), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
            'meta_value' => true, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
            'fields'     => 'ID',
            'number'     => -1,
        ]);

        if (empty($users)) {
            return false;
        }

        $succeeded = [];
        $failed = [];

        foreach ($users as $user_id) {
            $delete_type = $is_permanent_delete ? UserDeleteType::PERMANENT : UserDeleteType::ANONYMIZE;
            $deleted = $this->delete($user_id, $delete_type);

            if ($deleted) {
                $succeeded[] = $user_id;
            } else {
                $failed[] = $user_id;
            }
        }

        return count($succeeded) > 0;
    }

    /**
     * Delete multiple existing fundraisers by their id's with associated metadata.
     *
     * @param array $ids The ID's of the fundraisers.
     * @param string $type Whether to delete permanently or just mark as deleted or anonymize.
     * @return array Response array with success and failure messages.
     * @throws Exception If something went wrong.
     */
    public function bulk_delete(array $ids, $type = null)
    {
        $succeeded = [];
        $failed = [];

        foreach ($ids as $id) {
            try {
                $result = $this->delete($id, $type);

                if ($result === false) {
                    $failed[] = [
                        'id' => $id,
                        'message' => $type === UserDeleteType::PERMANENT || $type === UserDeleteType::ANONYMIZE
                            ? __('Fundraisers could not be deleted.', 'growfund-pro')
                            : __('Fundraisers could not be trashed.', 'growfund-pro'),
                    ];
                } else {
                    $succeeded[] = [
                        'id' => $id,
                        'message' => $type === UserDeleteType::PERMANENT || $type === UserDeleteType::ANONYMIZE
                            ? __('Fundraisers has been deleted.', 'growfund-pro')
                            : __('Fundraisers has been trashed.', 'growfund-pro'),
                    ];
                }
            } catch (Exception $error) {
                $failed[] = [
                    'id' => $id,
                    'message' => $error->getMessage(),
                ];
            }
        }

        return [
            'succeeded' => $succeeded,
            'failed' => $failed,
        ];
    }

    /**
     * Restore multiple trashed fundraisers by their id's.
     * Iterates through each id and attempts to restore the corresponding fundraiser.
     * Collects information on which fundraisers were successfully restored and which failed.
     *
     * @param array<int> $ids The ids of the fundraisers to be restored.
     * @return array Contains 'succeeded' and 'failed' arrays with id and message for each fundraiser.
     * @throws Exception If an error occurs during the restoration process.
     */
    public function bulk_restore(array $ids)
    {
        $succeeded = [];
        $failed = [];

        foreach ($ids as $id) {
            try {
                $result = $this->restore($id);

                if ($result === false) {
                    $failed[] = [
                        'id' => $id,
                        'message' => __('Fundraisers could not be restored.', 'growfund-pro'),
                    ];
                } else {
                    $succeeded[] = [
                        'id' => $id,
                        'message' => __('Fundraisers has been restored.', 'growfund-pro'),
                    ];
                }
            } catch (Exception $error) {
                $failed[] = [
                    'id' => $id,
                    'message' => $error->getMessage(),
                ];
            }
        }

        return [
            'succeeded' => $succeeded,
            'failed' => $failed,
        ];
    }

    /**
     * Get fundraiser overview
     * @param int $id
     * @return FundraiserOverviewDTO
     */
    public function get_overview(int $id)
    {
        $user = growfund_user($id);

        if (!$user->is_fundraiser()) {
            throw new Exception(esc_html__("Fundraiser not found", 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $fundraiser_info = $this->format_data($user->get());


        $activity_filter_dto = ActivityFilterDTO::from_array([
            'page' => 1,
            'limit' => 6,
            'orderby' => 'created_at',
            'order' => 'DESC',
            'user_id' => $id,
        ]);

        $activities = (new ActivityService())->paginated($activity_filter_dto, Activities::FUNDRAISER);

        $dto = new FundraiserOverviewDTO();

        $dto->total_campaign_created = $this->get_total_campaigns_created($id);    

        if (growfund_app()->is_donation_mode()) {
            $dto->total_amount_received = (new DonationService())->get_total_received_amount_by_fundraiser($id);
        } else {
            $dto->total_amount_received = (new PledgeService())->get_total_received_amount_by_fundraiser($id);
            $dto->total_successful_campaign = (new CampaignService())->get_count_of_successful_campaigns_for_fundraiser($id);
            $dto->total_failed_campaign = (new CampaignService())->get_count_of_failed_campaigns_for_fundraiser($id);
        }

        $dto->profile = $fundraiser_info;
        $dto->activity_logs = !empty($activities['results']) ? $activities['results'] : [];

        return $dto;
    }

    /**
     * Get user by user IDs
     * @param array $user_ids
     * 
     * @return UserInfoDTO[]
     */
    public function get_collaborators_by_user_ids(array $user_ids)
    {
        if (empty($user_ids)) {
            return [];
        }
        
        $users = get_users([
			'include' => array_map('intval', $user_ids),
			'orderby' => 'include',
		]);

        $results = [];
        
        foreach ($users as $user) {
            $dto = new UserInfoDTO();

            $dto->id = $user->ID;
            $dto->first_name = $user->first_name;
            $dto->last_name = $user->last_name;
            $dto->display_name = $user->display_name;
            $dto->email = $user->user_email;
            $dto->username = $user->user_login;
            $dto->image = UserSupport::get_avatar_image($user->ID);
            $dto->phone = UserSupport::get_phone_number($user->ID);

            $results[] = $dto;
        }

        return $results;
    }

    /**
     * Get fundraiser payout method
     * @param int $id
     * @return PayoutMethodDTO|null
     */
    public function get_payout_method(int $id)
    {
        $payout_data = UserMeta::get($id, 'payout_method', true);

        if (empty($payout_data)) {
            return null;
        }

        return PayoutMethodDTO::from_array($payout_data);
    }

    /**
     * Update the fundraiser's payout payment method.
     *
     * @param int $id The ID of the fundraiser post.
     * @param PayoutMethodDTO $dto The DTO containing payout payment method details.
     * 
     * @return bool True if successfully updated the payment method, throws Exception otherwise.
     * 
     * @throws Exception If the fundraiser could not be found.
     */
    public function update_payout_method(int $id, PayoutMethodDTO $dto)
    {
        $user = growfund_user($id);

        if (!$user->is_fundraiser()) {
            /* translators: %s: fundraiser id */
            throw new Exception(sprintf(esc_html__('Fundraiser with ID %s not found.', 'growfund-pro'), esc_html($id)));
        }

        $payout_data = $dto->to_array();
        
        if (!empty($dto->bank_details_document)) {
            $fundraiser_payout_method = $this->get_payout_method($id);
            $old_bank_details_document = $fundraiser_payout_method->bank_details_document ?? null;

            if (FileHandler::is_valid_file($dto->bank_details_document['file'])) {
                $file_handler = new FileHandler('fundraiser/' . $id . '/bank-details-document');
                $file_response = $file_handler->upload(
                    $dto->bank_details_document['file'], 
                    null,
                    !empty($old_bank_details_document) ? $file_handler->get_name($old_bank_details_document['file']) : null
                );
        
                if ($file_response['success']) {
                    $file_target = $file_response['file_path'];
                    $payout_data['bank_details_document']['file'] = $file_target;
                    $payout_data['bank_details_document']['file_name'] = pathinfo(
                        $dto->bank_details_document['file']['name'], 
                        PATHINFO_BASENAME
                    );
                }
            } else {
                $payout_data['bank_details_document'] = $old_bank_details_document;
            }
        }

        $payout_data = array_filter($payout_data, function ($value, $key) {
            if ($key === 'bank_details_document') {
                return $value;
            }

            return !is_null($value);
        }, ARRAY_FILTER_USE_BOTH);

        
        $updated = UserMeta::update($id, 'payout_method', $payout_data);
        
        if (!$updated) {
            throw new Exception(esc_html__('Failed to update payout payment method', 'growfund-pro'));
        }

        return true;
    }
}
