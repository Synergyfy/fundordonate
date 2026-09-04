<?php

namespace GrowfundPro\Services;

use Exception;
use Growfund\Constants\UserTypes\Admin;
use Growfund\DTO\PaginatedCollectionDTO;
use Growfund\DTO\User\UserInfoDTO;
use Growfund\Exceptions\ValidationException;
use Growfund\Supports\Pagination as PaginationSupport;
use Growfund\Supports\Paginator;
use Growfund\Supports\User as UserSupport;
use Growfund\Supports\UserMeta;
use GrowfundPro\DTO\Collaborator\CreateCollaboratorDTO;
use WP_User_Query;

defined( 'ABSPATH' ) || exit;

class CollaboratorService {
    /**
     * Store collaborator
     * 
     * @param CreateCollaboratorDTO $dto
     * 
     * @return int
     */
    public function store(CreateCollaboratorDTO $dto) {
        $user = get_user_by('login', $dto->username);

        if ($user) {
            throw ValidationException::with_errors(['username' => [esc_html__('Username already exists', 'growfund-pro')]], esc_html__('Username already exists', 'growfund-pro'));
        }

        $user = get_user_by('email', $dto->email);

        if ($user) {
            throw ValidationException::with_errors(['email' => [esc_html__('Email already exists', 'growfund-pro')]], esc_html__('Email already exists', 'growfund-pro'));
        }

        $userdata = [
            'user_login' => $dto->username,
            'user_email' => $dto->email,
            'user_pass' => $dto->password,
            'first_name' => $dto->first_name,
            'last_name' => $dto->last_name,
        ];

        $user_id = wp_insert_user($userdata);

        if (is_wp_error($user_id)) {
            throw new Exception(esc_html($user_id->get_error_message()));
        }

        $dto->created_by = growfund_user()->get_id();

        $meta_input = $dto->get_meta(['username']);

        UserMeta::update_many($user_id, $meta_input);

        return $user_id;
    }

    /**
     * Get paginated list of users.
     *
     * @param array $params Associative array containing:
     *   - int    'limit'       Number of results per page.
     *   - int    'page'        Current page number.
     *   - string 'search'      Search keyword.
     *   - string 'orderby'     Order by field.
     *   - string 'order'       ASC | DESC.
     *
     * @return PaginatedCollectionDTO
     */
    public function paginated(array $params)
    {
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $orderby = !empty($params['orderby']) ? $params['orderby'] : 'ID';
        $order = !empty($params['order']) && in_array(strtoupper($params['order']), ['ASC', 'DESC'], true) 
            ? $params['order']
            : 'DESC';
        $search = !empty($params['search']) ? $params['search'] : '';

        $query_args = [
            'count_total'    => true,
            'number'         => $limit,
            'paged'          => $page,
            'search'         => '*' . $search . '*',
            'search_columns' => ['ID', 'user_login', 'user_email', 'user_nicename'],
            'orderby'        => $orderby,
            'order'          => strtoupper($order),
            'exclude'        => [growfund_user()->get_id()],
            'role__not_in'   => [Admin::ROLE],
        ];

        $query = new WP_User_Query($query_args);

        $results = [];

        $users = $query->get_results();

        if (!empty($users)) {
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
        }

        $total = $query->get_total();
        $overall = PaginationSupport::get_overall_user_count();

        return PaginatedCollectionDTO::from_array(Paginator::make_metadata(
            $results,
            (int) $limit,
            (int) $page,
            $total,
            $overall
        ));
    }

    /**
     * Get campaign collaborators.
     * 
     * @param int $campaign_id
     * 
     * @return UserInfoDTO[]
     */
    public function campaign_collaborators(int $campaign_id) {
        $campaign_service = new CampaignService();
        $collaborator_ids = $campaign_service->get_collaborator_ids_by_campaign_id($campaign_id);

        if (empty($collaborator_ids)) {
            return [];
        }

        $query_args = [
            'include'        => $collaborator_ids,
        ];

        $query = new WP_User_Query($query_args);

        $results = [];

        $users = $query->get_results();

        if (!empty($users)) {
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
        }

        return $results;
    }
}
