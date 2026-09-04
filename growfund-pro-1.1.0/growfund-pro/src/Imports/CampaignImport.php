<?php

namespace GrowfundPro\Imports;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Contracts\Importable;
use Growfund\DTO\Campaign\CampaignRawDTO;
use Growfund\PostTypes\Campaign;
use GrowfundPro\Services\CampaignService;
use Growfund\Supports\PostMeta;
use Growfund\Taxonomies\Category;
use Growfund\Taxonomies\Tag;
use Exception;

class CampaignImport implements Importable
{
    private $campaign_import_dto;

    public function __construct(CampaignRawDTO $campaign_import_dto)
    {
        $this->campaign_import_dto = $campaign_import_dto->exclude(['id']);
    }

    /**
     * Import a campaign.
     * 
     * @return int campaign id
     */
    public function import()
    {
        $campaign_id = wp_insert_post([
            'post_type'    => Campaign::NAME,
            'post_title'   => $this->campaign_import_dto->title,
            'post_content' => $this->campaign_import_dto->description ?? '',
            'post_author'  => growfund_user()->get_id(),
            'post_status'  => Campaign::DEFAULT_POST_STATUS,
        ], true);

        if (is_wp_error($campaign_id)) {
            throw new Exception(
                esc_html__('Failed to create campaign.', 'growfund-pro'),
                esc_html($campaign_id->get_error_message())
            );
        }

        PostMeta::update_many($campaign_id, $this->campaign_import_dto->get_meta(['collaborators']));

        $categories = [
            $this->campaign_import_dto->category ?? 0,
            $this->campaign_import_dto->sub_category ?? 0
        ];

        wp_set_object_terms($campaign_id, $categories, Category::NAME);
        wp_set_object_terms($campaign_id, $this->campaign_import_dto->tags, Tag::NAME, false);

        // Sync collaborators
        (new CampaignService())->sync_collaborators($campaign_id, $this->campaign_import_dto->collaborators);

        return $campaign_id;
    }
}
