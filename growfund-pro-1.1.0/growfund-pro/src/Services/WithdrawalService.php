<?php

namespace GrowfundPro\Services;

defined( 'ABSPATH' ) || exit;

use Exception;
use Growfund\Constants\Tables;
use Growfund\Constants\WP;
use Growfund\QueryBuilder;
use Growfund\Supports\Date;
use Growfund\Supports\FileHandler;
use GrowfundPro\App\Events\WithdrawalRequestAcceptedEvent;
use GrowfundPro\App\Events\WithdrawalRequestReceivedEvent;
use GrowfundPro\App\Events\WithdrawalRequestRejectedEvent;
use GrowfundPro\Constants\WalletReferenceType;
use GrowfundPro\Constants\WalletTransactionAction;
use GrowfundPro\Constants\WalletTransactionStatus;
use GrowfundPro\Constants\WalletTransactionType;
use GrowfundPro\Constants\WithdrawalRequestStatus;
use GrowfundPro\DTO\Fundraiser\PayoutMethodDTO;
use GrowfundPro\DTO\Wallet\WalletDTO;
use GrowfundPro\DTO\Wallet\WalletTransactionDTO;
use GrowfundPro\DTO\WithdrawalRequest\CreateWithdrawalRequestDTO;
use GrowfundPro\DTO\WithdrawalRequest\UpdateWithdrawalRequestDTO;
use GrowfundPro\DTO\WithdrawalRequest\WithdrawalFilterDTO;
use GrowfundPro\DTO\WithdrawalRequest\WithdrawalRequestDTO;

class WithdrawalService {

    /**
     * Fundraiser service instance.
     *
     * @var FundraiserService
     */
    protected $fundraiser_service;

    /**
     * Wallet service instance.
     *
     * @var WalletService
     */
    protected $wallet_service;

    /**
     * Wallet transaction service instance.
     *
     * @var WalletTransactionService
     */
    protected $wallet_transaction_service;

    public function __construct()
    {
        $this->fundraiser_service = new FundraiserService();
        $this->wallet_service = new WalletService();
        $this->wallet_transaction_service = new WalletTransactionService();
    }

    public function paginated(WithdrawalFilterDTO $filter_dto)
    {
        $query = $this->get_query($filter_dto);

        $overall_query_conditions = [];

        if (!empty($params->user_id)) {
            $overall_query_conditions[] = ['user_id', '=', $params->user_id];
        }

        $paginated = $query->paginate($filter_dto->page, $filter_dto->limit, $overall_query_conditions);

        $results = $paginated['results'];

        foreach ($results as $key => $record) {
            $record->id = $record->ID;
            $paginated['results'][$key] = $this->prepare_withdrawal_dto($record);
        }

        return $paginated;
    }

    /**
     * Get a withdrawal request by ID.
     * @param int $id
     * @return WithdrawalRequestDTO|null
     */
    public function get_by_id(int $id)
    {
        $result = $this->get_query(new WithdrawalFilterDTO())->find($id, 'withdrawal_requests.ID');

        if (!$result) {
            return null;
        }

        return $this->prepare_withdrawal_dto($result);
    }

    /**
     * Prepare withdrawal dto
     * @param object $record
     * @return WithdrawalRequestDTO
     */
    protected function prepare_withdrawal_dto($record)
    {
        $dto = new WithdrawalRequestDTO();

        $dto->id = (string) $record->ID;
        $dto->fundraiser = growfund_user($record->user_id)->get_data();
        $dto->amount = $record->amount;
        $dto->method = $record->method;
        $dto->status = $record->status;
        $dto->created_at = $record->created_at;
        $dto->status = $record->status ?? WithdrawalRequestStatus::PENDING;
        $dto->note = $record->note;
        $dto->attachment = $record->attachment;
        $dto->has_attachment = !empty($record->attachment);
        $payout_info = json_decode($record->payout_info ?? "", true);
        $dto->payout_info = PayoutMethodDTO::from_array($payout_info ? $payout_info : []);
        $dto->updated_at = $record->updated_at;
        $dto->updated_by = $record->updated_by;

        return $dto;
    }

    /**
     * Get query with applying conditions
     * @param WithdrawalFilterDTO $params
     * @return QueryBuilder
     */
    protected function get_query(WithdrawalFilterDTO $params)
    {
        $query = QueryBuilder::query()
            ->select([
                'withdrawal_requests.*'
            ])
            ->table(Tables::WITHDRAWAL_REQUESTS . ' as withdrawal_requests');

        if (!empty($params->search)) {
            $query->inner_join(WP::USERS_TABLE . ' as users', 'users.ID', 'withdrawal_requests.user_id')
                ->where_raw(
                    '( users.user_login LIKE :search OR users.user_email LIKE :search OR users.display_name LIKE :search )',
                    [
                        'search' => '%' . $params->search . '%'
                    ]
                );
        }

        if (!empty($params->user_id)) {
            $query->where('withdrawal_requests.user_id', $params->user_id);
        }

        if (!empty($params->status)) {
            if (is_array($params->status)) {
                $query->where_in('withdrawal_requests.status', $params->status);
            } else {
                $query->where('withdrawal_requests.status', $params->status);
            }
        }

        if (!empty($params->method)) {
            $query->where('withdrawal_requests.method', $params->method);
        }


        if ($params->start_date) {
            $query->where('DATE(withdrawal_requests.created_at)', '>=', $params->start_date);
        }

        if ($params->end_date) {
            $query->where('DATE(withdrawal_requests.created_at)', '<=', $params->end_date);
        }

        if (!empty($params->orderby)) {
            $query->order_by('withdrawal_requests.' . $params->orderby, $params->order ??  'DESC');
        }

        return $query;
    }

    public function store(CreateWithdrawalRequestDTO $dto)
    {
        $fundraiser = growfund_user()->get_data();

        if (empty($fundraiser)) {
            throw new Exception(esc_html__('Fundraiser not found', 'growfund-pro'));
        }

        $wallet = $this->wallet_service->get_by_fundraiser_id($fundraiser->id);

        if (empty($wallet)) {
            throw new Exception(esc_html__('Wallet not found', 'growfund-pro'));
        }

        $payout_info = $this->fundraiser_service->get_payout_method(growfund_user()->get_id());

        QueryBuilder::begin_transaction();

        try {
            $dto->user_id = $fundraiser->id;
            $dto->amount = $dto->amount ?? 0;
            $dto->method = $payout_info->payment_method ?? 'others';
            $dto->payout_info = $payout_info ? wp_json_encode($payout_info->to_array()) : null;
            $dto->status = WithdrawalRequestStatus::PENDING;
            $dto->created_at = Date::current_sql_safe();

            $withdrawal_id = QueryBuilder::query()
                ->table(Tables::WITHDRAWAL_REQUESTS)
                ->create($dto->to_array());

            if (empty($withdrawal_id)) {
                throw new Exception(esc_html__('Failed to create withdrawal request', 'growfund-pro'));
            }

            $withdrawal_request = WithdrawalRequestDTO::from_array($dto->to_array());
            $withdrawal_request->id = (string) $withdrawal_id;
            $withdrawal_request->fundraiser = $fundraiser->id;

            $dto = new WalletTransactionDTO();
            $dto->wallet_id = $wallet->id;
            $dto->campaign_id = null;
            $dto->reference_id = $withdrawal_request->id;
            $dto->reference_type = WalletReferenceType::WITHDRAWAL_REQUEST;
            $dto->action = WalletTransactionAction::CREDIT;
            $dto->type = WalletTransactionType::WITHDRAWAL_REQUEST;
            $dto->amount = $withdrawal_request->amount;
            $dto->status = WalletTransactionStatus::PENDING;
            
            $this->wallet_transaction_service->store($dto);
            $this->insert_withdrawal_items($withdrawal_request, $wallet);
            $this->wallet_service->re_calculate_wallet((int) $fundraiser->id);

            QueryBuilder::commit();

            growfund_event(new WithdrawalRequestReceivedEvent($withdrawal_request));

            return $withdrawal_id;
        } catch (Exception $error) {
            QueryBuilder::rollback();
            throw $error;
        }
    }

    protected function insert_withdrawal_items(WithdrawalRequestDTO $withdrawal_request, WalletDTO $wallet)
    {
        $records = $this->get_campaigns_with_remaining_balance($withdrawal_request, $wallet);

        $remaining = $withdrawal_request->amount;

        $withdrawal_items = [];

        foreach ($records as $record) {
            if ($remaining <= 0) {
                break;
            }

            $net_balance = $record->total_earned - $record->total_consumed - $record->platform_fees;

            if ($net_balance <= 0) {
                continue;
            }

            $take = min($remaining, $net_balance);

            $withdrawal_items[] = [
                'withdrawal_request_id' => $withdrawal_request->id,
                'campaign_id' => $record->campaign_id,
                'amount' => $take
            ];

            $remaining -= $take;
        }

        if (!empty($withdrawal_items)) {
            QueryBuilder::query()
                ->table(Tables::WITHDRAWAL_ITEMS)
                ->insert($withdrawal_items);
        }
    }

    protected function get_campaigns_with_remaining_balance(WithdrawalRequestDTO $withdrawal_request, WalletDTO $wallet)
    {
        $sql = "
            SELECT 
                main.campaign_id,
                main.total_earned,
                main.platform_fees,
                IFNULL(consumed.total_consumed, 0) as total_consumed
            FROM (
                SELECT 
                    campaign_id,
                    SUM(CASE WHEN type = :type_earning AND status = :status_completed THEN amount ELSE 0 END) as total_earned,
                    SUM(CASE WHEN type = :type_platform_fee THEN amount ELSE 0 END) as platform_fees
                FROM " . QueryBuilder::prefix(Tables::WALLET_TRANSACTIONS) . "
                WHERE wallet_id = :wallet_id
                AND campaign_id IS NOT NULL
                GROUP BY campaign_id
            ) as main
            LEFT JOIN (
                SELECT 
                    withdrawal_items.campaign_id, 
                    SUM(withdrawal_items.amount) as total_consumed 
                FROM " . QueryBuilder::prefix(Tables::WITHDRAWAL_ITEMS) . " as withdrawal_items
                INNER JOIN " . QueryBuilder::prefix(Tables::WITHDRAWAL_REQUESTS) . " as withdrawal_requests 
                ON withdrawal_items.withdrawal_request_id = withdrawal_requests.ID
                WHERE withdrawal_requests.user_id = :fundraiser_id AND withdrawal_requests.status != :status_rejected
                GROUP BY withdrawal_items.campaign_id
            ) as consumed ON main.campaign_id = consumed.campaign_id
            HAVING (total_earned - platform_fees - total_consumed) > 0
        ";

        $result = QueryBuilder::raw($sql, [
            'wallet_id'         => $wallet->id,
            'fundraiser_id'   => $withdrawal_request->fundraiser->id,
            'type_earning'      => WalletTransactionType::EARNING,
            'status_completed'  => WalletTransactionStatus::COMPLETED,
            'type_platform_fee' => WalletTransactionType::PLATFORM_FEE,
            'status_rejected'   => WithdrawalRequestStatus::REJECTED
        ]);

        return $result;
    }


    /**
     * Update withdrawal request status
     * @param WithdrawalRequestDTO $withdrawal_request
     * @param UpdateWithdrawalRequestDTO $status
     * @param string $note
     * @param file $attachment
     */
    public function update_status(WithdrawalRequestDTO $withdrawal_request, UpdateWithdrawalRequestDTO $update_dto)
    {
        $data = [
            'status' => $update_dto->status,
            'updated_at' => Date::current_sql_safe(),
            'updated_by' => growfund_user()->get_id()
        ];

        if (!is_null($update_dto->attachment)) {
            $file_handler = new FileHandler('withdrawal-invoices/' . $withdrawal_request->id);
            $file_response = $file_handler->upload($update_dto->attachment);

            if (!$file_response['success']) {
                return false;
            }

            $file_target = $file_response['file_path'];
            $data['attachment'] = $file_target;
        }

        if (!is_null($update_dto->note)) {
            $data['note'] = $update_dto->note;
        }

        QueryBuilder::begin_transaction();

        try {
            $is_updated = QueryBuilder::query()
                ->table(Tables::WITHDRAWAL_REQUESTS)
                ->where('ID', $withdrawal_request->id)
                ->update($data);

            if (!empty($is_updated)) {
                if ($update_dto->status === WithdrawalRequestStatus::APPROVED) {
                    $this->after_status_change($withdrawal_request, WalletTransactionType::WITHDRAWAL_APPROVAL);
                    growfund_event(new WithdrawalRequestAcceptedEvent($withdrawal_request));
                }

                if ($update_dto->status === WithdrawalRequestStatus::REJECTED) {
                    $this->after_status_change($withdrawal_request, WalletTransactionType::WITHDRAWAL_REJECTION);
                    growfund_event(new WithdrawalRequestRejectedEvent($withdrawal_request));
                }
            }

            QueryBuilder::commit();

            return !empty($is_updated);
        } catch (Exception $error) {
            QueryBuilder::rollback();
            throw $error;
        }
    }

    protected function after_status_change(WithdrawalRequestDTO $withdrawal_request, string $type) {
        if (empty($withdrawal_request->fundraiser)) {
            throw new Exception(esc_html__('Fundraiser not found', 'growfund-pro'));
        }
        
        $wallet = $this->wallet_service->get_by_fundraiser_id($withdrawal_request->fundraiser->id);

        if (empty($wallet)) {
            throw new Exception(esc_html__('Wallet not found', 'growfund-pro'));
        }

        $dto = new WalletTransactionDTO();
        $dto->wallet_id = $wallet->id;
        $dto->campaign_id = null;
        $dto->reference_id = $withdrawal_request->id;
        $dto->reference_type = WalletReferenceType::WITHDRAWAL_REQUEST;
        $dto->action = WalletTransactionAction::CREDIT;
        $dto->type = $type;
        $dto->amount = $withdrawal_request->amount;
        $dto->status = WalletTransactionStatus::COMPLETED;
        
        $transaction_id = $this->wallet_transaction_service->store($dto);

        if (!empty($transaction_id)) {
            $prev_transaction = $this->wallet_transaction_service->get_withdrawal_transaction(
                $withdrawal_request->fundraiser->id, 
                $withdrawal_request->id
            );

            if (!empty($prev_transaction)) {
                $this->wallet_transaction_service->update_status($prev_transaction->id, WalletTransactionStatus::COMPLETED);
            }

            $this->wallet_service->re_calculate_wallet((int) $withdrawal_request->fundraiser->id);
        }

        return !empty($transaction_id);
    }
}
