<?php

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Actions\RegisterRoles;
use GrowfundPro\Actions\ResetRewriteRules;

return [
    RegisterRoles::class,
    ResetRewriteRules::class,
];
