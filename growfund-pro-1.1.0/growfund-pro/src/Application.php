<?php

namespace GrowfundPro;

defined( 'ABSPATH' ) || exit;

use Growfund\Contracts\Action;
use GrowfundPro\Providers\AppServiceProvider;
use GrowfundPro\Providers\HookServiceProvider;

class Application
{
    /** @var static */
    protected static $instance;

    /** @var \Growfund\Application|null */
    protected $app;


    /**
     * Create a new application instance
     *
     * @return void
     */
    protected function __construct()
    {
        if (can_load_growfund_pro()) {
            $this->app = growfund_app();
            $this->register_core_service_providers();
        }
    }

    /**
     * Configure the application.
     *
     * @return self
     */
    public static function get_instance()
    {
        if (static::$instance) {
            return static::$instance;
        }
        
        static::$instance = new static();
        return static::$instance;
    }

    public static function handle_activation()
    {
		if (!is_growfund_active()) {
			deactivate_plugins(GROWFUND_PRO_BASENAME);
            
            return;
		}

        $activation_actions = require_once GROWFUND_PRO_DIR_PATH . 'configs/activation-actions.php';

        static::get_instance()->run_actions($activation_actions);
    }

    public static function handle_deactivation()
    {
        if (!can_load_growfund_pro()) {
            return;
        }

        $deactivation_actions = require_once GROWFUND_PRO_DIR_PATH . 'configs/deactivation-actions.php';

        static::get_instance()->run_actions($deactivation_actions);
    }

    public static function handle_uninstallation()
    {
        if (!can_load_growfund_pro()) {
            return;
        }

        $uninstallation_actions = require_once GROWFUND_PRO_DIR_PATH . 'configs/uninstallation-actions.php';
        
        static::get_instance()->run_actions($uninstallation_actions);
    }

    protected function register_core_service_providers()
    {
        if (empty($this->app)) {
            return;
        }
        
        $this->app->register(new AppServiceProvider($this->app));
        $this->app->register(new HookServiceProvider($this->app));
    }

    /**
     * @param array $actions
     */
    protected function run_actions($actions = [])
    {
        foreach ($actions as $action) {
            if (!class_exists($action) || !is_subclass_of($action, Action::class)) {
                continue;
            }
            
            (new $action())->handle();
        }
    }
}
