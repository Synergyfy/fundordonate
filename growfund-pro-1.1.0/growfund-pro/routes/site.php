<?php

defined( 'ABSPATH' ) || exit;

use Growfund\Middlewares\Site\AdminOrFundraiserMiddleware;
use Growfund\Middlewares\Site\FundraiserMiddleware;
use Growfund\Middlewares\Site\GuestMiddleware;
use Growfund\SiteRouter;
use GrowfundPro\Controllers\API\WithdrawalController;
use GrowfundPro\Controllers\Site\FundraiserController;

// Authentication Routes
SiteRouter::get('auth/register-fundraiser/', [FundraiserController::class, 'show_register_fundraiser'])
    ->middleware(GuestMiddleware::class)
    ->name('auth.register.fundraiser.show');

// Dashboard Routes
SiteRouter::get('dashboard/fundraiser', [FundraiserController::class, 'show'])
    ->middleware(FundraiserMiddleware::class)
    ->name('dashboard.fundraiser');

SiteRouter::get('withdrawal-requests/{id}/invoices/download', [WithdrawalController::class, 'download_invoice'])
    ->where('id', '[\d]+')
    ->middleware(AdminOrFundraiserMiddleware::class)
    ->name('withdrawal-requests.invoice.download');

SiteRouter::get(
        'fundraisers/{id}/bank-details-document/download', 
        [FundraiserController::class, 'download_bank_details_document']
    )
    ->where('id', '[\d]+')
    ->name('fundraisers.bank-details-document.download');
