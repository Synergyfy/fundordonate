<?php

namespace GrowfundPro\Schedules;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Tables;
use Growfund\Constants\UserTypes\Backer;
use Growfund\Constants\UserTypes\Donor;
use Growfund\Constants\WP;
use Growfund\Contracts\RecurrableScheduler;
use GrowfundPro\Mails\CampaignPostUpdateMail;
use Growfund\QueryBuilder;

class CampaignPostUpdateSchedule implements RecurrableScheduler
{

    protected $campaign_id;
    protected $last_user_id = 0;
    protected $users = [];

    public function __construct($data)
    {
        $this->campaign_id = $data['campaign_id'];
        $this->last_user_id = $data['last_user_id'] ?? 0;
        $this->users = $this->get_users();
    }

    public function should_stop()
    {
        return empty($this->users);
    }

    public function get_additional_args()
    {
        return [
            'last_user_id' => $this->last_user_id
        ];
    }

    public function handle()
    {
        foreach ($this->users as $user) {
            growfund_scheduler()->resolve(CampaignPostUpdateMail::class)
                ->with([
                    'receiver_user_id' => $user->id,
                    'campaign_id' => $this->campaign_id,
                ])
                ->group('growfund_campaign_post_update_mails')
                ->schedule_email();
        }
    }

    protected function get_users()
    {
        $limit = 20;
        $role_name = '';

        $query = QueryBuilder::query()->table(WP::USERS_TABLE . ' as users')
            ->select(['users.ID as id', 'users.user_email as email', 'users.display_name']);

        if (growfund_app()->is_donation_mode()) {
            $role_name = Donor::ROLE;
            $query->inner_join(Tables::DONATIONS . ' as donations', 'donations.user_id', 'users.ID')
                ->where('donations.campaign_id', $this->campaign_id);
        } else {
            $role_name = Backer::ROLE;
            $query->inner_join(Tables::PLEDGES . ' as pledges', 'pledges.user_id', 'users.ID')
                ->where('pledges.campaign_id', $this->campaign_id);
        }

        $query->join_raw(
            WP::USER_META_TABLE . ' as user_meta',
            'INNER',
            sprintf(
                'users.ID = user_meta.user_id AND user_meta.meta_key = %s AND user_meta.meta_value LIKE %s',
                "'" . QueryBuilder::prefix('capabilities') . "'",
                "'%" . $role_name . "%'"
            )
        )->where('users.ID', '>', $this->last_user_id)
            ->order_by('users.ID', 'ASC')
            ->limit($limit + 1);


        $users = $query->get();

        $more_exists = count($users) > $limit;

        if ($more_exists) {
            array_pop($users);
        }


        $last_user = end($users);

        if ($last_user) {
            $this->last_user_id = $last_user->id;
        }

        return $users;
    }
}
