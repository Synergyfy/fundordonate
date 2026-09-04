<?php

defined( 'ABSPATH' ) || exit;

use Growfund\Middlewares\API\AdminMiddleware;
use Growfund\Middlewares\API\AuthMiddleware;
use Growfund\Route;
use GrowfundPro\Controllers\API\CampaignController;
use GrowfundPro\Controllers\API\CollaboratorController;
use GrowfundPro\Controllers\API\FundController;
use GrowfundPro\Controllers\API\FundraiserController;
use GrowfundPro\Controllers\API\LicenseController;
use GrowfundPro\Controllers\API\PaymentGatewayController;
use GrowfundPro\Controllers\API\WalletController;
use GrowfundPro\Controllers\API\WithdrawalController;

Route::group(['middleware' => AuthMiddleware::class], function () {
	Route::post('/campaigns/{campaign_id}/copy', [CampaignController::class, 'make_a_copy'])->where('campaign_id', '[\d]+');

	// Funds routes
	Route::get('/funds', [FundController::class, 'paginated']);
	Route::get('/funds/{id}', [FundController::class, 'get_by_id'])->where('id', '[\d]+');
	Route::get('/funds/{id}/details', [FundController::class, 'details'])->where('id', '[\d]+');
	Route::post('/funds', [FundController::class, 'create']);
	Route::put('/funds/{id}', [FundController::class, 'update'])->where('id', '[\d]+');
	Route::delete('/funds/{id}', [FundController::class, 'delete'])->where('id', '[\d]+');
	Route::delete('/funds/empty-trash', [FundController::class, 'empty_trash']);
	Route::patch('/funds/bulk-actions', [FundController::class, 'bulk_actions']);
	Route::get('/funds/all', [FundController::class, 'all']);

	// Fundraisers routes
	Route::get('/fundraisers', [FundraiserController::class, 'paginated']);
	Route::post('/fundraisers', [FundraiserController::class, 'create']);
	Route::post('/make-fundraiser', [FundraiserController::class, 'make_fundraiser']);
	Route::put('/fundraisers/{id}', [FundraiserController::class, 'update'])->where('id', '[\d]+');
	Route::patch('/fundraisers/{id}', [FundraiserController::class, 'update_status'])->where('id', '[\d]+')->middleware(AdminMiddleware::class);
	Route::delete('/fundraisers/{id}', [FundraiserController::class, 'delete'])->where('id', '[\d]+');
	Route::delete('/fundraisers/empty-trash', [FundraiserController::class, 'empty_trash'])->middleware(AdminMiddleware::class);
	Route::patch('/fundraisers/bulk-actions', [FundraiserController::class, 'bulk_actions'])->middleware(AdminMiddleware::class);
	Route::get('/fundraisers/{id}/overview', [FundraiserController::class, 'overview'])->where('id', '[\d]+');
	Route::get('/fundraisers/{id}/activities', [FundraiserController::class, 'activities'])->where('id', '[\d]+');
	Route::post('/fundraisers/{id}/payout-method', [FundraiserController::class, 'update_payout_method'])
        ->where('id', '[\d]+');

    // Collaborator routes
    Route::get('/collaborators', [CollaboratorController::class, 'paginated']);
	Route::post('/collaborators', [CollaboratorController::class, 'create']);
	Route::get('campaigns/{campaign_id}/collaborators', [CollaboratorController::class, 'campaign_collaborators'])
        ->where('campaign_id', '[\d]+');

    // Wallet routes
    Route::get('/wallet', [WalletController::class, 'get_info']);
    Route::get('/withdrawals', [WithdrawalController::class, 'paginated']);
	Route::post('/withdrawals', [WithdrawalController::class, 'create']);
    Route::post('/withdrawals/{id}', [WithdrawalController::class, 'update_status'])
        ->where('id', '[\d]+')
        ->middleware(AdminMiddleware::class);

	// License routes
	Route::get('/license-info', [LicenseController::class, 'info'])->middleware(AdminMiddleware::class);
	Route::post('/licenses/{license_key}', [LicenseController::class, 'update'])->where('license_key', '[a-zA-Z0-9\-_]+')->middleware(AdminMiddleware::class);
	Route::delete('/licenses/{license_key}', [LicenseController::class, 'delete'])->where('license_key', '[a-zA-Z0-9\-_]+')->middleware(AdminMiddleware::class);
	Route::post('/licenses/{license_key}/check-authorization', [LicenseController::class, 'check_authorization'])
        ->where('license_key', '[a-zA-Z0-9\-_]+')
        ->middleware(AdminMiddleware::class);

    //Payment Gateway routes
    Route::get('/payment-gateways', [PaymentGatewayController::class, 'available'])->middleware(AdminMiddleware::class);
    Route::post('payment-gateways/install', [PaymentGatewayController::class, 'install'])->middleware(AdminMiddleware::class);
    Route::put('/payment-gateways/{name}', [PaymentGatewayController::class, 'store'])->where('name', '[a-zA-Z0-9\-_]+')->middleware(AdminMiddleware::class);
});
