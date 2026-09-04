<?php

namespace GrowfundPro\DTO\WithdrawalRequest;

defined( 'ABSPATH' ) || exit;

use Growfund\DTO\DTO;
use Growfund\Sanitizer;

class UpdateWithdrawalRequestDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $action;

    /** @var string */
    public $status;

    /** @var string */
    public $note;

    /** @var File */
    public $attachment;

    public static function validation_rules()
    {   
        return [
            'id'       => 'required',
            'action'   => 'required|string|in:approve,decline',
            'note'   => 'prohibited_if:action,approve|required_if:action,decline|string',
            'attachment'   => 'nullable|file',
        ];
    }

    public static function sanitization_rules()
    {
        return [
            'id' => Sanitizer::INT,
            'action' => Sanitizer::TEXT,
            'note' => Sanitizer::TEXTAREA,
            'attachment' => Sanitizer::FILE,
        ];
    }
}
