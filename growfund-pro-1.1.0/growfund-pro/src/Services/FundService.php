<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Growfund\Constants\Pagination;
use Growfund\Constants\Status\DonationStatus;
use Growfund\Constants\Status\FundStatus;
use Growfund\Constants\Tables;
use Growfund\DTO\Donation\DonationFilterParamsDTO;
use Growfund\DTO\Fund\FundDetailsDTO;
use Growfund\DTO\Fund\FundDTO;
use Growfund\DTO\Fund\FundListDTO;
use Growfund\Http\Response;
use Growfund\QueryBuilder;
use Growfund\Supports\Arr;
use Growfund\Supports\Date;
use DateTime;
use Exception;
use Growfund\Services\FundService as FreeFundService;

/**
 * FundService class
 * @since 1.0.0
 */
class FundService extends FreeFundService
{
    /**
     * Create a new fund
     * 
     * @param FundDTO $fund_dto
     * 
     * @return int $fund_id
     */
    public function store(FundDTO $fund_dto)
    {
        $current_date_time = Date::current_sql_safe();

        $fund_dto->created_at = $current_date_time;
        $fund_dto->created_by = growfund_user()->get_id();
        $fund_dto->updated_at = $current_date_time;
        $fund_dto->updated_by = growfund_user()->get_id();
        $fund_dto->status = FundStatus::PUBLISHED;

        $fund_id = QueryBuilder::query()
            ->table(Tables::FUNDS)
            ->create($fund_dto->except(['id', 'is_default']));

        if ($fund_id === false) {
            throw new Exception(esc_html__('Failed to create fund', 'growfund-pro'));
        }

        return $fund_id;
    }

    /**
     * Update existing fund by id
     * 
     * @param int $fund_id
     * @param FundDTO $fund_dto
     * 
     * @return bool
     */
    public function update(int $fund_id, FundDTO $fund_dto)
    {
        $fund = QueryBuilder::query()->table(Tables::FUNDS)->find($fund_id);

        if (empty($fund)) {
            throw new Exception(esc_html__('Fund not found', 'growfund-pro'), (int) Response::NOT_FOUND);
        }

        $fund_dto->updated_at = Date::current_sql_safe();
        $fund_dto->updated_by = growfund_user()->get_id();

        $is_updated =  QueryBuilder::query()
            ->table(Tables::FUNDS)
            ->where('ID', $fund_id)
            ->update($fund_dto->only(['title', 'description', 'updated_at', 'updated_by']));

        if ($is_updated === false) {
            throw new Exception(esc_html__('Failed to update fund', 'growfund-pro'));
        }

        return !empty($is_updated);
    }


    /**
     * Delete existing fund by id
     * 
     * @param int $id
     * @param bool $force
     * 
     * @return bool
     */
    public function delete(int $id, $force = false)
    {
        $default_fund = QueryBuilder::query()->table(Tables::FUNDS)
            ->select(['ID as id'])
            ->where('is_default', 1)
            ->first();

        if (!empty($default_fund) && $default_fund->id === $id) {
            throw new Exception(esc_html__('Cannot delete default fund', 'growfund-pro'));
        }

        if ($force) {
            $this->donation_service->change_fund_to_default($id);

            $is_deleted = QueryBuilder::query()->table(Tables::FUNDS)->where('ID', $id)->delete();
        } else {
            $is_deleted = QueryBuilder::query()->table(Tables::FUNDS)->where('ID', $id)->update(['status' => FundStatus::TRASHED]);
        }

        return !empty($is_deleted);
    }

    /**
     * Restore a trashed fund
     *
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function restore(int $id): bool
    {
        $is_restored = QueryBuilder::query()->table(Tables::FUNDS)->where('ID', $id)->update(['status' => FundStatus::PUBLISHED]);

        return !empty($is_restored);
    }

    /**
     * Delete multiple existing funds by their id's
     *
     * @param array $ids The ID's of the funds.
     * @param bool $force Force delete or trash
     * @return array Response array with success and failure messages.
     * @throws Exception If something went wrong.
     */
    public function bulk_delete(array $ids, bool $force = false)
    {
        $succeeded = [];
        $failed = [];

        foreach ($ids as $id) {
            try {
                $result = $this->delete($id, $force);

                if ($result === false) {
                    $failed[] = [
                        'id' => $id,
                        'message' => $force
                            ? __('Fund could not be deleted.', 'growfund-pro')
                            : __('Fund could not be trashed.', 'growfund-pro'),
                    ];
                } else {
                    $succeeded[] = [
                        'id' => $id,
                        'message' => $force
                            ? __('Fund has been deleted.', 'growfund-pro')
                            : __('Fund has been trashed.', 'growfund-pro'),
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
     * Delete all the trashed campaigns
     *
     * @return bool
     */
    public function empty_trash($user_id = null)
    {
        $query = QueryBuilder::query()
            ->table(Tables::FUNDS)
            ->select(['ID'])
            ->where('status', FundStatus::TRASHED);

        if ($user_id) {
            $query->where('created_by', $user_id);
        }

        $results = $query->get();

        $ids = [];

        foreach ($results as $result) {
            $ids[] = $result->ID;
        }

        try {
            $response = $this->bulk_delete($ids, true);
        } catch (Exception $error) {
            return false;
        }

        return count($response['succeeded']) > 0;
    }

    /**
     * Restore multiple trashed funds by their ids.
     *
     * @param array<int> $ids The ids of the funds to be restored.
     * @return array Contains 'succeeded' and 'failed' arrays with id and message for each fund.
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
                        'message' => __('Fund could not be restored.', 'growfund-pro'),
                    ];
                } else {
                    $succeeded[] = [
                        'id' => $id,
                        'message' => __('Fund has been restored.', 'growfund-pro'),
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

    public function paginated(array $params = [])
    {
        $page = $params['page'] ?? 1;
        $limit = $params['limit'] ?? 10;
        $search = $params['search'] ?? '';
        $orderby = $params['orderby'] ?? 'created_at';
        $order = $params['order'] ?? 'DESC';
        $status = $params['status'] ?? FundStatus::PUBLISHED;

        $query = QueryBuilder::query()
            ->table(Tables::FUNDS)
            ->select(['ID', 'title', 'description', 'is_default'])
            ->where('status', $status);

        if (!empty($search)) {
            $query->where('title', 'like', '%' . $search . '%');
        }

        $paginated = $query->order_by($orderby, strtoupper($order))
            ->paginate($page, $limit);

        $funds = [];

        foreach ($paginated['results'] as $key => $fund) {
            $funds[$key] = $this->format_fund_data($fund);
        }

        $paginated['results'] = $funds;

        return $paginated;
    }

    /**
     * Get list of all funds without pagination
     *
     * @return array
     */
    public function all()
    {
        $funds = QueryBuilder::query()
            ->table(Tables::FUNDS)
            ->select(['ID', 'title', 'is_default'])
            ->where('status', FundStatus::PUBLISHED)
            ->get();

        return Arr::make($funds)->map(function ($fund) {
            return [
                'id' => (string) $fund->ID,
                'title' => $fund->title,
                'is_default' => (bool) $fund->is_default,
            ];
        })->toArray();
    }

    /**
     * Format fund data into a structured array.
     *
     * @param object $fund The fund object containing fund details.
     * @return array Formatted fund data with donation statistics.
     */
    protected function format_fund_data($fund)
    {
        $donations_filter_dto = new DonationFilterParamsDTO();
        $donations_filter_dto->fund_id = $fund->ID;
        $donations_filter_dto->limit = null;

        $donations = $this->donation_service->latest($donations_filter_dto);

        $number_of_contributions = count($donations);
        $total_revenue = 0;
        $latest_donation_date = $donations[0]->created_at ?? null;

        foreach ($donations as $donation) {
            if ($donation->status === DonationStatus::COMPLETED) {
                $total_revenue += $donation->amount;
            }
        }

        return FundListDTO::from_array([
            'id' => (string) $fund->ID,
            'title' => $fund->title,
            'description' => $fund->description,
            'is_default' => (bool) $fund->is_default,
            'number_of_contributions' => $number_of_contributions,
            'total_revenue' => $total_revenue,
            'latest_donation_date' => $latest_donation_date
        ]);
    }

    /**
     * Retrieve detailed information of the fund.
     * 
     * This method will return a FundDetailsDTO which contains the fund's
     * details, revenue chart data and the recent donations.
     * 
     * @param int $id The ID of the fund.
     * 
     * @return FundDetailsDTO
     */
    public function details(int $id, $start_date, $end_date)
    {
        $dto = FundDetailsDTO::from_array($this->get_by_id($id)->all());

        $filter_params_dto = new DonationFilterParamsDTO();
        $filter_params_dto->fund_id = $id;
        $filter_params_dto->start_date = $start_date;
        $filter_params_dto->end_date = $end_date;
        $filter_params_dto->limit = Pagination::LIMIT;

        $dto->revenue = $this->donation_analytic_service->get_revenue_chart_data(new DateTime($start_date), new DateTime($end_date), null, $id);

        $dto->recent_donations = $this->donation_service->latest($filter_params_dto);

        return $dto;
    }
}
