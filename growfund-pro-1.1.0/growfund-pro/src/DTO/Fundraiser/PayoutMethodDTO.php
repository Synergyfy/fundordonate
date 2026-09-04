<?php

namespace GrowfundPro\DTO\Fundraiser;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Constants\BankTransferTypes;
use GrowfundPro\Constants\PayoutMethods;
use Growfund\DTO\DTO;
use Growfund\Sanitizer;
use Growfund\Supports\FileHandler;

class PayoutMethodDTO extends DTO
{
    /** @var string */
    public $payment_method;

    /** @var string */
    public $type;

    /** @var string */
    public $account_holder_name;

    /** @var string */
    public $account_number;

    /** @var string */
    public $swift_bic;

    /** @var string */
    public $bsb_code;

    /** @var string */
    public $bank_name;

    /** @var string */
    public $branch_name;

    /** @var string */
    public $district;

    /** @var string */
    public $sort_code;

    /** @var string */
    public $routing_number;

    /** @var string */
    public $state_province;

    /** @var string */
    public $city;

    /** @var string */
    public $zip_code;

    /** @var string */
    public $address;

    /** @var string */
    public $institution_code;

    /** @var string */
    public $transit_code;

    /** @var array */
    public $bank_details_document;

    /** @var string */
    public $email;

    /** @var string */
    public $information;

    protected function get_casts()
    {
        return [
            'bank_details_document' => function () {
                if (empty($this->bank_details_document)) {
                    return null;
                }
                
                return [
                    'file_name' => $this->bank_details_document['file_name'] ?? '',
                ];
            }
        ];
    }

    public static function validation_rules()
    {
        return [
            'payment_method' => 'required|in:' . implode(',', PayoutMethods::get_constant_values()),
            'type' => 'required_if:payment_method,' . PayoutMethods::BANK . '|in:' . implode(',', BankTransferTypes::get_constant_values()),
            'account_holder_name' => 'required_if:payment_method,' . PayoutMethods::BANK . '|string',
            'account_number' => 'required_if:payment_method,' . PayoutMethods::BANK . '|string',
            'swift_bic' => 'required_if:type,' . BankTransferTypes::IBAN . '|string',
            'bank_details_document' => 'nullable|array',
            'bank_details_document.file' => 'file',
            'routing_number' => 'required_if:type,' . implode(';', [BankTransferTypes::USD, BankTransferTypes::BEFTN]) . '|string',
            'state_province' => 'required_if:type,' . implode(';', [BankTransferTypes::USD, BankTransferTypes::CAD, BankTransferTypes::AUD]) . '|string',
            'city' => 'required_if:type,' . implode(';', [BankTransferTypes::USD, BankTransferTypes::CAD, BankTransferTypes::AUD, BankTransferTypes::BEFTN]) . '|string',
            'zip_code' => 'required_if:type,' . implode(';', [BankTransferTypes::USD, BankTransferTypes::CAD, BankTransferTypes::AUD, BankTransferTypes::BEFTN]) . '|string',
            'address' => 'required_if:type,' . implode(';', [BankTransferTypes::USD, BankTransferTypes::CAD, BankTransferTypes::AUD, BankTransferTypes::BEFTN]) . '|string',
            'institution_code' => 'required_if:type,' . BankTransferTypes::CAD . '|string',
            'transit_code' => 'required_if:type,' . BankTransferTypes::CAD . '|string',
            'bsb_code' => 'required_if:type,' . BankTransferTypes::AUD . '|string',
            'bank_name' => 'required_if:type,' . BankTransferTypes::BEFTN . '|string',
            'branch_name' => 'required_if:type,' . BankTransferTypes::BEFTN . '|string',
            'district' => 'required_if:type,' . BankTransferTypes::BEFTN . '|string',
            'sort_code' => 'required_if:type,' . BankTransferTypes::GBP . '|string',
            'email' => 'required_if:payment_method,' . PayoutMethods::PAYPAL . '|email',
            'information' => 'required_if:payment_method,' . PayoutMethods::OTHER . '|string',
        ];
    }

    public static function sanitization_rules()
    {
        return [
            'payment_method' => Sanitizer::TEXT,
            'type' => Sanitizer::TEXT,
            'account_holder_name' => Sanitizer::TEXT,
            'account_number' => Sanitizer::TEXT,
            'swift_bic' => Sanitizer::TEXT,
            'bank_details_document.file' => Sanitizer::FILE,
            'routing_number' => Sanitizer::TEXT,
            'state_province' => Sanitizer::TEXT,
            'city' => Sanitizer::TEXT,
            'zip_code' => Sanitizer::TEXT,
            'address' => Sanitizer::TEXT,
            'institution_code' => Sanitizer::TEXT,
            'transit_code' => Sanitizer::TEXT,
            'bsb_code' => Sanitizer::TEXT,
            'bank_name' => Sanitizer::TEXT,
            'branch_name' => Sanitizer::TEXT,
            'district' => Sanitizer::TEXT,
            'sort_code' => Sanitizer::TEXT,
            'email' => Sanitizer::EMAIL,
            'information' => Sanitizer::TEXTAREA,
        ];
    }
}
