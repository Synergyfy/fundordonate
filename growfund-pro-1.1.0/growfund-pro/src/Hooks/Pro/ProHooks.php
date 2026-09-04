<?php

namespace GrowfundPro\Hooks\Pro;

defined( 'ABSPATH' ) || exit;

use GrowfundPro\Hooks\HookProvider;
use GrowfundPro\Hooks\Pro\Backer\BackerHooks;
use GrowfundPro\Hooks\Pro\Fundraiser\FundraiserHooks;
use GrowfundPro\Hooks\Pro\Campaign\CampaignHooks;
use GrowfundPro\Hooks\Pro\Donation\DonationHooks;
use GrowfundPro\Hooks\Pro\Donor\DonorHooks;
use GrowfundPro\Hooks\Pro\Fund\FundHooks;
use GrowfundPro\Hooks\Pro\Pledge\PledgeHooks;
use GrowfundPro\Hooks\Pro\Settings\SettingHooks;
use GrowfundPro\Hooks\Pro\WithdrawalRequest\WithdrawalRequestHooks;

class ProHooks implements HookProvider {
    public static function get()
    {
        return array_merge(
            CampaignHooks::get(),
            BackerHooks::get(),
            DonorHooks::get(),
            SettingHooks::get(),
            FundraiserHooks::get(),
            FundHooks::get(),
            PledgeHooks::get(),
            DonationHooks::get(),
            WithdrawalRequestHooks::get(),
        );
    }
}
