<?php

namespace GrowfundPro\DTO\Collaborator;

use Growfund\DTO\DTO;
use Growfund\Sanitizer;

defined( 'ABSPATH' ) || exit;

class CreateCollaboratorDTO extends DTO {
    /**
     * Fields that are considered not part of "meta" data.
     *
     * @var array
     */
    protected static $base_fields = ['first_name', 'last_name', 'email', 'password'];

    /** @var string */
    public $first_name;

    /** @var string */
    public $last_name;

    /** @var string */
    public $email;

    /** @var string */
    public $username;

    /** @var string */
    public $password;

    /** @var string */
    public $image;

    /** @var string|null */
    public $phone;

    /** @var int */
    public $created_by;

    public static function validation_rules()
    {
        return [
            'first_name'                    => 'required|string',
            'last_name'                     => 'required|string',
            'email'                         => 'required|email',
            'username'                      => 'required|string',
            'password'                      => 'required|string|min:6',
            'phone'                         => 'string',
            'image'                         => 'integer|is_valid_image_id',
        ];
    }

    public static function sanitization_rules()
    {
        return [
            'first_name'                    => Sanitizer::TEXT,
            'last_name'                     => Sanitizer::TEXT,
            'username'                      => Sanitizer::USERNAME,
            'email'                         => Sanitizer::EMAIL,
            'password'                      => Sanitizer::TEXT,
            'phone'                         => Sanitizer::TEXT,
            'image'                         => Sanitizer::INT,
        ];
    }
}
