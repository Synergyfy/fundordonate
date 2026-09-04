<?php

defined( 'ABSPATH' ) || exit;

use Growfund\App\Events\CampaignHalfMilestoneReachedEvent;
use Growfund\App\Events\CampaignPostUpdateEvent;
use Growfund\App\Events\CampaignStatusUpdateEvent;
use Growfund\App\Events\DonationCreatedEvent;
use Growfund\App\Events\DonationStatusUpdateEvent;
use Growfund\App\Events\GoalReachedEvent;
use Growfund\App\Events\PledgeCreatedEvent;
use Growfund\App\Events\PledgeStatusUpdateEvent;
use GrowfundPro\App\Events\WithdrawalRequestAcceptedEvent;
use GrowfundPro\App\Events\WithdrawalRequestReceivedEvent;
use GrowfundPro\App\Events\WithdrawalRequestRejectedEvent;
use GrowfundPro\App\Listeners\CampaignHalfMilestoneReachedEmailsListener;
use GrowfundPro\App\Listeners\CampaignPostUpdateEmailListener;
use GrowfundPro\App\Listeners\CampaignStatusUpdateEmailListener;
use GrowfundPro\App\Listeners\DonationCreatedEmailListener;
use GrowfundPro\App\Listeners\DonationStatusUpdateEmailListener;
use GrowfundPro\App\Listeners\GoalReachedEmailsListener;
use GrowfundPro\App\Listeners\PledgeCreatedEmailListener;
use GrowfundPro\App\Listeners\PledgeStatusUpdateEmailListener;
use GrowfundPro\App\Listeners\WithdrawalRequestAcceptedEmailListener;
use GrowfundPro\App\Listeners\WithdrawalRequestReceivedEmailListener;
use GrowfundPro\App\Listeners\WithdrawalRequestRejectedEmailListener;

return [
    CampaignHalfMilestoneReachedEvent::class => [
        CampaignHalfMilestoneReachedEmailsListener::class,
    ],
    CampaignPostUpdateEvent::class => [
        CampaignPostUpdateEmailListener::class,
    ],
    CampaignStatusUpdateEvent::class => [
        CampaignStatusUpdateEmailListener::class,
    ],
    DonationCreatedEvent::class => [
        DonationCreatedEmailListener::class,
    ],
    DonationStatusUpdateEvent::class => [
        DonationStatusUpdateEmailListener::class,
    ],
    GoalReachedEvent::class => [
        GoalReachedEmailsListener::class,
    ],
    PledgeCreatedEvent::class => [
        PledgeCreatedEmailListener::class,
    ],
    PledgeStatusUpdateEvent::class => [
        PledgeStatusUpdateEmailListener::class,
    ],
    WithdrawalRequestReceivedEvent::class => [
        WithdrawalRequestReceivedEmailListener::class,
    ],
    WithdrawalRequestAcceptedEvent::class => [
        WithdrawalRequestAcceptedEmailListener::class,
    ],
    WithdrawalRequestRejectedEvent::class => [
        WithdrawalRequestRejectedEmailListener::class,
    ],
];
