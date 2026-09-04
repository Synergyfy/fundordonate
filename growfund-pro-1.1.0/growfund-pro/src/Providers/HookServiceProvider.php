<?php

namespace GrowfundPro\Providers;

defined( 'ABSPATH' ) || exit;

use Growfund\Core\ServiceProvider;
use Growfund\Supports\Hook;
use GrowfundPro\Hooks\Hooks;

class HookServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        Hook::register(Hooks::get());
    }
}
