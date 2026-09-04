<?php

namespace GrowfundPro\Providers;

defined( 'ABSPATH' ) || exit;

use Growfund\Core\ServiceProvider;
use GrowfundPro\Core\PluginInstaller;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->register_providers();
        $this->register_events();
        $this->register_plugin_installer();
    }

    public function boot()
    {
    }

    protected function register_events()
    {
        $events = require_once GROWFUND_PRO_DIR_PATH . 'bootstrap/events.php';

        foreach ($events as $event => $listeners) {
            foreach ($listeners as $listener) {
                growfund_dispatcher()->listen($event, $listener);
            }
            
        }
    }

    /**
     * Register other on demand provided providers.
     *
     * @return void
     */
    protected function register_providers()
    {
        $providers  = require GROWFUND_PRO_DIR_PATH . 'bootstrap/providers.php';

        if (empty($providers)) {
            return;
        }

        foreach ($providers as $provider) {
            if (!class_exists($provider) || !is_subclass_of($provider, ServiceProvider::class)) {
                throw new InvalidArgumentException(
                    sprintf(
                        /* translators: 1: Provider class name, 2: ServiceProvider class name */
                        esc_html__('Class %1$s must be a subclass of %2$s.', 'growfund'),
                        esc_html($provider),
                        ServiceProvider::class
                    )
                );
            }

            $this->app->register(new $provider($this->app));
        }
    }

    /**
     * Register the plugin installer service.
     *
     * @return void
     * @since 1.0.0
     */
    protected function register_plugin_installer()
    {
        $this->app->singleton(PluginInstaller::class, function () {
            return new PluginInstaller();
        });
    }
}
