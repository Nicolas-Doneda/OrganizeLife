<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return url("/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}");
        });

        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
            
            // Força todos os links de assets (CSS/JS do Vite) para usarem HTTPS
            $this->app['request']->server->set('HTTPS','on');
        }
    }
}
