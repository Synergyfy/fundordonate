<?php

defined( 'ABSPATH' ) || exit;

// Register your custom service providers here
// e.g. [CustomServiceProvider::class, AnotherServiceProvider::class, ...]

use GrowfundPro\App\Providers\CampaignServiceProvider;

return [
    CampaignServiceProvider::class,
];
