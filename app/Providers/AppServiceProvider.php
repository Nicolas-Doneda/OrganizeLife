<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        // Rate Limiter customizado para login e auth por E-mail + IP
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email');
            return Limit::perMinute(5)->by($email . '|' . $request->ip());
        });

        // Rate Limiter para verificação 2FA
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return url("/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}");
        });

        \App\Models\MonthlyBill::observe(\App\Observers\MonthlyBillObserver::class);
        \App\Models\Income::observe(\App\Observers\IncomeObserver::class);
        \App\Models\SavingDeposit::observe(\App\Observers\SavingDepositObserver::class);

        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
            
            // Força todos os links de assets (CSS/JS do Vite) para usarem HTTPS
            $this->app['request']->server->set('HTTPS','on');
        }
    }
}
