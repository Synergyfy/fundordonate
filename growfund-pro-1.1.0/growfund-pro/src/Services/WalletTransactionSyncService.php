<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Exception;
use Growfund\Constants\Status\CampaignStatus;
use Growfund\Constants\Status\DonationStatus;
use Growfund\Constants\Status\PledgeStatus;
use Growfund\Constants\Tables;
use Growfund\Constants\UserTypes\Fundraiser;
use Growfund\Constants\WP;
use Growfund\QueryBuilder;
use Growfund\Supports\AdminUser;
use Growfund\Supports\Arr;
use Growfund\Supports\Date;
use Growfund\Supports\PriceCalculator;
use GrowfundPro\Constants\WalletReferenceType;
use GrowfundPro\Constants\WalletTransactionAction;
use GrowfundPro\Constants\WalletTransactionStatus;
use GrowfundPro\Constants\WalletTransactionType;

class WalletTransactionSyncService {
    /**
     * Sync wallet transactions
     * 
     * @return int Number of processed transactions
     */
    public function sync() {
        if (growfund_app()->is_donation_mode()) {
            return $this->sync_donations();
        }

        return $this->sync_pledges();
    }

    protected function sync_pledges() 
    {
        $unprocessed_pledges = Arr::make();

        QueryBuilder::query()
            ->table(Tables::PLEDGES . ' as pledges')
            ->select([
                'pledges.ID',
				'pledges.campaign_id',
				'pledges.status',
				'pledges.amount',
				'pledges.bonus_support_amount',
				'pledges.shipping_cost',
				'pledges.recovery_fee',
				'pledges.processing_fee',
                'campaigns.post_author as campaign_author',
				'IFNULL(campaign_fundraiser_meta.meta_value, campaigns.post_author) as campaign_fundraiser_id'
            ])
            ->inner_join(WP::POSTS_TABLE . ' as campaigns', 'campaigns.ID', 'pledges.campaign_id')
            ->join_raw(
                Tables::WALLET_TRANSACTIONS . ' as withdrawal_transactions',
                'LEFT',
                'pledges.ID = withdrawal_transactions.reference_id AND withdrawal_transactions.reference_type = :reference_type_pledge',
                ['reference_type_pledge' => WalletReferenceType::PLEDGE]
            )
            ->join_raw(
                WP::POST_META_TABLE . ' as campaign_fundraiser_meta',
                'LEFT',
                'campaign_fundraiser_meta.post_id = campaigns.ID AND campaign_fundraiser_meta.meta_key = :meta_fundraiser_id',
                ['meta_fundraiser_id' => growfund_with_prefix('fundraiser_id')]
            )
            ->where_null('withdrawal_transactions.ID')
            ->where_raw('( pledges.status = :status_backed OR pledges.status = :status_completed )', [
                'status_backed' => PledgeStatus::BACKED,
                'status_completed' => PledgeStatus::COMPLETED
            ])
            ->chunk_by_id(5000, function($pledges) use (&$unprocessed_pledges) {
                if (empty($pledges)) {
					return false;
				}

                $unprocessed_pledges->merge($pledges);
            });

        return $this->process_pledges($unprocessed_pledges);
    }

    /**
     * Process pledges
     * 
     * @param Arr $unprocessed_pledges
     * 
     * @return int Number of processed pledges
     */
    protected function process_pledges(Arr $unprocessed_pledges)
    {
        $processed = 0;
        $user_ids = $unprocessed_pledges->map(function($pledge) {
            return !empty($pledge->campaign_fundraiser_id) 
                ? (int) $pledge->campaign_fundraiser_id 
                : (int) $pledge->campaign_author;
        })->filter(function($fundraiser_id) {
            return (int) $fundraiser_id !== AdminUser::get_id();
        })->unique()->values()->toArray();

        if (empty($user_ids)) {
            return $processed;
        }

        $fundraiser_ids = get_users([
			'include' => array_map('intval', $user_ids),
			'orderby' => 'include',
            'fields' => 'ID',
            'role' => Fundraiser::ROLE,
		]);

        $fundraiser_ids = Arr::make($fundraiser_ids ?? [])->map(fn ($id) => (int) $id)->toArray();

        $campaign_ids = $unprocessed_pledges->filter(function($pledge) use ($fundraiser_ids) {
            $fundraiser_id = $pledge->campaign_fundraiser_id ?? $pledge->campaign_author;

            return (int) $fundraiser_id !== AdminUser::get_id() && in_array((int) $fundraiser_id, $fundraiser_ids, true);
        })->pluck('campaign_id')->unique()->values()->toArray();

        $campaign_statuses = QueryBuilder::query()
            ->table(WP::POST_META_TABLE . ' as campaigns')
            ->select([
                'campaigns.post_id as id',
                'campaigns.meta_value as status',
            ])
            ->where('campaigns.meta_key', growfund_with_prefix('status'))
            ->where_in('campaigns.post_id', $campaign_ids)
            ->get();

        $campaign_statuses = Arr::make($campaign_statuses);

        $this->sync_wallets($fundraiser_ids);

        QueryBuilder::begin_transaction();

        try {
            $unprocessed_pledges->chunk(2000, function(Arr $pledges) use ($campaign_statuses, $fundraiser_ids, &$processed) {
                $transactions = [];

                $pledges->foreach(function($pledge) use (&$transactions, $campaign_statuses, $fundraiser_ids) {
                    $campaign = $campaign_statuses->find(function($campaign) use ($pledge) {
                        return (int) $campaign->id === (int) $pledge->campaign_id;
                    });

                    if (empty($campaign)) {
                        return;
                    }

                    $fundraiser_id = $pledge->campaign_fundraiser_id ?? $pledge->campaign_author;

                    if ((int) $fundraiser_id === AdminUser::get_id() || !in_array((int) $fundraiser_id, $fundraiser_ids, true)) {
                        return;
                    }

                    $transactions[] = [
                        'wallet_id' => QueryBuilder::raw_prepare(
                            '(SELECT ID FROM `' . QueryBuilder::prefix(Tables::WALLETS) . '` WHERE user_id = :fundraiser_id)',
                            ['fundraiser_id' => (int) $fundraiser_id]
                        ),
                        'campaign_id' => $pledge->campaign_id,
                        'reference_id' => $pledge->ID,
                        'reference_type' => WalletReferenceType::PLEDGE,
                        'amount' => PriceCalculator::calculate_pledge_total_amount(
                            $pledge->amount, 
                            $pledge->bonus_support_amount, 
                            $pledge->shipping_cost
                        ),
                        'action' => WalletTransactionAction::DEBIT,
                        'type' => WalletTransactionType::EARNING,
                        'status' => $campaign->status === CampaignStatus::COMPLETED 
                            ? WalletTransactionStatus::COMPLETED 
                            : WalletTransactionStatus::PENDING,
                        'created_at' => Date::current_sql_safe(),
                    ];
                });

                if (!empty($transactions)) {
                    $processed += count($transactions);

                    QueryBuilder::query()
                        ->table(Tables::WALLET_TRANSACTIONS)
                        ->insert($transactions);
                }
            });

            $unprocessed_pledges->groupBy('campaign_id')->foreach(function($pledges, $campaign_id) use ($campaign_statuses, $fundraiser_ids) {
				$campaign = $campaign_statuses->find(function($campaign) use ($campaign_id) {
					return (int) $campaign->id === (int) $campaign_id;
				});

				$pledge = Arr::make($pledges)->front();
            
				if (empty($pledge)|| empty($campaign)) {
					return;
				}

				if ($campaign->status === CampaignStatus::COMPLETED) {
                    $fundraiser_id = $pledge->campaign_fundraiser_id ?? $pledge->campaign_author;

                    if ((int) $fundraiser_id === AdminUser::get_id() || !in_array((int) $fundraiser_id, $fundraiser_ids, true)) {
                        return;
                    }

					$wallet_transaction_service = new WalletTransactionService();
					$wallet_transaction_service->calculate_campaign_platform_fee(
                    (int) $pledge->campaign_id, 
                    (int) $fundraiser_id
					);

					$wallet_service = new WalletService();
					$wallet_service->re_calculate_wallet((int) $fundraiser_id);
				}
			});

            QueryBuilder::commit();
        } catch (Exception $error) {
            QueryBuilder::rollback();
            throw $error;
        }

        return $processed;
    }

    protected function sync_donations() 
    {
        $unprocessed_donations = Arr::make();

        QueryBuilder::query()
            ->table(Tables::DONATIONS . ' as donations')
            ->select([
                'donations.ID',
                'donations.campaign_id',
                'donations.status',
                'donations.amount',
                'donations.recovery_fee',
                'donations.processing_fee',
                'campaigns.post_author as campaign_author',
                'campaign_fundraiser_meta.meta_value as campaign_fundraiser_id'
            ])
            ->inner_join(WP::POSTS_TABLE . ' as campaigns', 'campaigns.ID', 'donations.campaign_id')
            ->join_raw(
                Tables::WALLET_TRANSACTIONS . ' as withdrawal_transactions',
                'LEFT',
                'donations.ID = withdrawal_transactions.reference_id AND withdrawal_transactions.reference_type = :reference_type_donation',
                ['reference_type_donation' => WalletReferenceType::DONATION]
            )
            ->join_raw(
                WP::POST_META_TABLE . ' as campaign_fundraiser_meta',
                'LEFT',
                'campaign_fundraiser_meta.post_id = campaigns.ID AND campaign_fundraiser_meta.meta_key = :meta_fundraiser_id',
                ['meta_fundraiser_id' => growfund_with_prefix('fundraiser_id')]
            )
            ->where_null('withdrawal_transactions.ID')
            ->where('donations.status', DonationStatus::COMPLETED)
            ->chunk_by_id(5000, function($donations) use (&$unprocessed_donations) {
                if (empty($donations)) {
					return false;
				}

                $unprocessed_donations->merge($donations);
            });

        return $this->process_donations($unprocessed_donations);
    } 

    /**
     * Process donations
     * 
     * @param Arr $unprocessed_donations
     * 
     * @return int Number of processed donations
     */
    protected function process_donations(Arr $unprocessed_donations)
    {
        $processed = 0;
        $user_ids = $unprocessed_donations->map(function($pledge) {
            return !empty($pledge->campaign_fundraiser_id) 
                ? (int) $pledge->campaign_fundraiser_id 
                : (int) $pledge->campaign_author;
        })->filter(function($fundraiser_id) {
            return (int) $fundraiser_id !== AdminUser::get_id();
        })->unique()->values()->toArray();

        if (empty($user_ids)) {
            return $processed;
        }

        $fundraiser_ids = get_users([
			'include' => array_map('intval', $user_ids),
			'orderby' => 'include',
            'fields' => 'ID',
            'role' => Fundraiser::ROLE,
		]);

        $fundraiser_ids = Arr::make($fundraiser_ids ?? [])->map(fn ($id) => (int) $id)->toArray();

        $campaign_ids = $unprocessed_donations->filter(function($donation) use ($fundraiser_ids) {
            $fundraiser_id = $donation->campaign_fundraiser_id ?? $donation->campaign_author;

            return (int) $fundraiser_id !== AdminUser::get_id() && in_array((int) $fundraiser_id, $fundraiser_ids, true);
        })->pluck('campaign_id')->unique()->values()->toArray();

        $campaign_statuses = QueryBuilder::query()
            ->table(WP::POST_META_TABLE . ' as campaigns')
            ->select([
                'campaigns.post_id as id',
                'campaigns.meta_value as status',
            ])
            ->where('campaigns.meta_key', growfund_with_prefix('status'))
            ->where_in('campaigns.post_id', $campaign_ids)
            ->get();

        $campaign_statuses = Arr::make($campaign_statuses);

        $this->sync_wallets($fundraiser_ids);

        QueryBuilder::begin_transaction();

        try {
            $unprocessed_donations->chunk(2000, function(Arr $donations) use ($campaign_statuses, $fundraiser_ids, &$processed) {
                $transactions = [];

                $donations->foreach(function($donation) use (&$transactions, $campaign_statuses, $fundraiser_ids) {
                    $campaign = $campaign_statuses->find(function($campaign) use ($donation) {
                        return (int) $campaign->id === (int) $donation->campaign_id;
                    });

                    if (empty($campaign)) {
                        return;
                    }

                    $fundraiser_id = $donation->campaign_fundraiser_id ?? $donation->campaign_author;

                    if ((int) $fundraiser_id === AdminUser::get_id() || !in_array((int) $fundraiser_id, $fundraiser_ids, true)) {
                        return;
                    }

                    $transactions[] = [
                        'wallet_id' => QueryBuilder::raw_prepare(
                            '(SELECT ID FROM `' . QueryBuilder::prefix(Tables::WALLETS) . '` WHERE user_id = :fundraiser_id)',
                            ['fundraiser_id' => (int) $fundraiser_id]
                        ),
                        'campaign_id' => $donation->campaign_id,
                        'reference_id' => $donation->ID,
                        'reference_type' => WalletReferenceType::PLEDGE,
                        'amount' => $donation->amount,
                        'action' => WalletTransactionAction::DEBIT,
                        'type' => WalletTransactionType::EARNING,
                        'status' => $campaign->status === CampaignStatus::COMPLETED 
                            ? WalletTransactionStatus::COMPLETED 
                            : WalletTransactionStatus::PENDING,
                        'created_at' => Date::current_sql_safe(),
                    ];
                });

                if (!empty($transactions)) {
                    $processed += count($transactions);

                    QueryBuilder::query()
                        ->table(Tables::WALLET_TRANSACTIONS)
                        ->insert($transactions);
                }
            });

            $unprocessed_donations->groupBy('campaign_id')->foreach(function($donations, $campaign_id, $fundraiser_ids) use ($campaign_statuses) {
				$campaign = $campaign_statuses->find(function($campaign) use ($campaign_id) {
					return (int) $campaign->id === (int) $campaign_id;
				});

				$donation = Arr::make($donations)->front();
            
				if (empty($donation) || empty($campaign)) {
					return;
				}

                $fundraiser_id = $donation->campaign_fundraiser_id ?? $donation->campaign_author;

                if ((int) $fundraiser_id === AdminUser::get_id() || !in_array((int) $fundraiser_id, $fundraiser_ids, true)) {
                    return;
				}

				if ($campaign->status === CampaignStatus::COMPLETED) {
					$wallet_transaction_service = new WalletTransactionService();
					$wallet_transaction_service->calculate_campaign_platform_fee(
                    (int) $donation->campaign_id, 
                    (int) $fundraiser_id
					);

					$wallet_service = new WalletService();
					$wallet_service->re_calculate_wallet((int) $fundraiser_id);
				}
			});
        
            QueryBuilder::commit();
        } catch (Exception $error) {
            QueryBuilder::rollback();
            throw $error;
        }

        return $processed;
    }

    protected function sync_wallets(array $fundraiser_ids)
    {
        $wallets = QueryBuilder::query()
            ->table(Tables::WALLETS . ' as wallets')
            ->select([
                'wallets.id',
                'wallets.user_id',
            ])
            ->where_in('wallets.user_id', $fundraiser_ids)
            ->get();

        $wallets = Arr::make($wallets);
        $new_wallets = [];

		foreach ($fundraiser_ids as $fundraiser_id) {
            if ((int) $fundraiser_id === AdminUser::get_id() || !in_array((int) $fundraiser_id, $fundraiser_ids, true)) {
                continue;
			}

			$wallet = $wallets->find(function($wallet) use ($fundraiser_id) {
				return (int) $wallet->user_id === (int) $fundraiser_id;
			});

			if (empty($wallet)) {
				$new_wallets[] = [
					'user_id' => $fundraiser_id
				];
			}
		}

        if (!empty($new_wallets)) {
            foreach (array_chunk($new_wallets, 2000) as $chunked) {
                QueryBuilder::query()
                    ->table(Tables::WALLETS)
                    ->insert($chunked);
            }
        }
    }
}
