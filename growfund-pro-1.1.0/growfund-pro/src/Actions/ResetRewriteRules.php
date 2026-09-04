<?php

namespace GrowfundPro\Actions;

defined( 'ABSPATH' ) || exit;

use Growfund\Contracts\Action;
use Growfund\Supports\RewriteRule;

class ResetRewriteRules implements Action
{
    public function handle()
    {
        RewriteRule::schedule_reset();
    }
}
