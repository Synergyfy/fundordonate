<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\FeeType;
use Growfund\Constants\Status\CampaignStatus;
use Growfund\Services\CampaignService as FreeCampaignService;
use Growfund\Constants\Tables;
use Growfund\Constants\UserTypes\Collaborator;
use Growfund\Constants\WP;
use Growfund\Core\AppSettings;
use Growfund\DTO\RewardItemWithQuantityDTO;
use GrowfundPro\Exports\CampaignExport;
use GrowfundPro\Imports\CampaignImport;
use Growfund\QueryBuilder;
use Growfund\Services\RewardItemService;
use Growfund\Services\RewardService;
use Growfund\Supports\Arr;
use Growfund\Supports\Date;
use Growfund\Supports\PostMeta;
use Throwable;

class CampaignService extends FreeCampaignService {
    /**
     * Synchronizes the collaborators for a campaign.
     *
     * This function updates the list of collaborators associated with a given
     * campaign by adding new collaborators and removing those who are no longer
     * part of the campaign.
     *
     * @param int $id The ID of the campaign.
     * @param array $collaborators An array containing the IDs of collaborators
     *                             to be associated with the campaign.
     * @return bool Returns true after successfully synchronizing the collaborators.
     */
    public function sync_collaborators(int $id, array $collaborators)
    {
        $incoming_collaborators_ids = array_unique(array_filter($collaborators, 'is_numeric'));

        $collaborator_records = QueryBuilder::query()
            ->table(Tables::CAMPAIGN_COLLABORATORS)
            ->select(['collaborator_id'])
            ->where('campaign_id', $id)
            ->get();

        $current_collaborator_ids = wp_list_pluck($collaborator_records, 'collaborator_id');

        $to_add = array_diff($incoming_collaborators_ids, $current_collaborator_ids);
        $to_remove = array_diff($current_collaborator_ids, $incoming_collaborators_ids);

        $data_to_insert = [];

        foreach ($to_add as $collaborator_id) {
            if (!growfund_user($collaborator_id)->is_collaborator()) {
                growfund_user($collaborator_id)->add_new_role(Collaborator::ROLE);
            }

            $data_to_insert[] = [
                'campaign_id' => $id,
                'collaborator_id' => $collaborator_id,
                'created_at' => Date::current_sql_safe(),
            ];
        }

        if (count($data_to_insert) > 0) {
            QueryBuilder::query()
                ->table(Tables::CAMPAIGN_COLLABORATORS)
                ->insert($data_to_insert);
        }

        if (count($to_remove) > 0) {
            QueryBuilder::query()->table(Tables::CAMPAIGN_COLLABORATORS)
                ->where('campaign_id', $id)
                ->where_in('collaborator_id', $to_remove)
                ->delete();
        }

        return true;
    }

    /**
     * Duplicate a campaign and its all related data.
     * 
     * @param int $campaign_id
     * 
     * @return int new campaign id
     * 
     * @throws Exception
     */
    public function duplicate_campaign(int $campaign_id)
    {
        QueryBuilder::begin_transaction();

        try {
            $raw_campaign = (new CampaignExport($campaign_id))->export();

            /* translators: %s: campaign title */
            $raw_campaign->title = sprintf(__('Copy of %s', 'growfund-pro'), $raw_campaign->title);
            $raw_campaign->slug = null;
            $raw_campaign->status = CampaignStatus::DRAFT;

            $new_campaign_id = (new CampaignImport($raw_campaign))->import();

            if (!growfund_app()->is_donation_mode()) {
                $new_reward_ids = [];
                $new_reward_item_ids = [];

                $reward_service = new RewardService();
                $reward_item_service = new RewardItemService();
                $rewards = $reward_service->get_all($campaign_id);
                $reward_items = $reward_item_service->get_all_by_campaign($campaign_id);

                foreach ($reward_items as $reward_item) {
                    $reward_item->image = $reward_item->image['id'] ?? null;
                    $reward_item->campaign_id = $new_campaign_id;

                    $new_reward_item_ids[(string) $reward_item->id] = (string) $reward_item_service->store($reward_item);
                }

                foreach ($rewards as $reward) {
                    $reward->items = Arr::make($reward->items ?? [])
                        ->map(function (RewardItemWithQuantityDTO $item)  use ($new_reward_item_ids) {
                            return [
                                'id' => $new_reward_item_ids[(string) $item->id],
                                'quantity' => $item->quantity
                            ];
                        })->toArray();
                    $reward->image = $reward->image['id'] ?? null;
                    $reward->campaign_id = $new_campaign_id;

                    $new_reward_ids[] = (string) $reward_service->create($reward);
                }

                PostMeta::update($new_campaign_id, 'rewards', $new_reward_ids);
            }

            QueryBuilder::commit();

            return $new_campaign_id;
        } catch (Throwable $error) {
            QueryBuilder::rollback();

            throw $error;
        }
    }

    /**
     * Gets the IDs of campaigns associated with a given fundraiser ID.
     * 
     * @param int $fundraiser_id The ID of the fundraiser to retrieve campaigns for.
     * @return QueryBuilder A query builder instance.
     */
    public function get_campaign_ids_by_fundraiser_query($fundraiser_id)
    {
        return QueryBuilder::query()->table(WP::POSTS_TABLE . ' as campaigns')
            ->select(['campaigns.ID as campaign_id'])
            ->join_raw(
                WP::POST_META_TABLE . ' as campaign_status_meta',
                'INNER',
                sprintf("campaigns.ID = campaign_status_meta.post_id AND campaign_status_meta.meta_key = '%s'", growfund_with_prefix('status'))
            )
            ->join_raw(
                WP::POST_META_TABLE . ' as campaign_fundraiser_meta',
                'LEFT',
                sprintf("campaigns.ID = campaign_fundraiser_meta.post_id AND campaign_fundraiser_meta.meta_key = '%s'", growfund_with_prefix('fundraiser_id'))
            )
            ->left_join(Tables::CAMPAIGN_COLLABORATORS . ' as collaborators', 'campaigns.ID', 'collaborators.campaign_id')
            ->where('campaign_status_meta.meta_value', '!=', CampaignStatus::TRASHED)
            ->where_raw(
                "(campaigns.post_author = :author_id OR campaign_fundraiser_meta.meta_value = :fundraiser_id OR collaborators.collaborator_id = :collaborator_id)",
                [
                    'author_id' => $fundraiser_id,
                    'fundraiser_id' => $fundraiser_id,
                    'collaborator_id' => $fundraiser_id
                ]
            );
    }

    /**
     * Gets the IDs of campaigns associated with a given collaborator ID.
     * 
     * @param int $collaborator_id The ID of the fundraiser to retrieve campaigns for.
     * @return int[] An array of IDs of campaigns associated with the collaborator.
     */
    public function get_campaign_ids_by_collaborator($collaborator_id)
    {
        $records = QueryBuilder::query()->table(WP::POSTS_TABLE . ' as campaigns')
            ->select(['campaigns.ID as campaign_id'])
            ->join_raw(
                WP::POST_META_TABLE . ' as campaign_status_meta',
                'INNER',
                sprintf("campaigns.ID = campaign_status_meta.post_id AND campaign_status_meta.meta_key = '%s'", growfund_with_prefix('status'))
            )
            ->left_join(Tables::CAMPAIGN_COLLABORATORS . ' as collaborators', 'campaigns.ID', 'collaborators.campaign_id')
            ->where('campaign_status_meta.meta_value', '!=', CampaignStatus::TRASHED)
            ->where_raw(
                "(collaborators.collaborator_id = :collaborator_id)",
                [
                    'collaborator_id' => $collaborator_id
                ]
            )
            ->get();

        $ids = Arr::make($records ?? [])->pluck('campaign_id')->map(fn ($id) => (int) $id)->toArray();

        return array_values(array_unique($ids));
    }
}
