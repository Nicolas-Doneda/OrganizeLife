<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // Confia nos proxies da Render para evitar erro de Mixed Content (HTTP em HTTPS)
        $middleware->trustProxies(at: '*');

        // EXPLICAÇÃO: Registra o middleware 'ability' do Sanctum
        // Usado para verificar se o token tem abilities específicas
        // Ex: 'ability:*' garante que o token NÃO é um temp_token limitado do 2FA
        $middleware->alias([
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
        ]);

        // EXPLICAÇÃO: Quando uma request de API não está autenticada,
        // o Sanctum tenta redirecionar para a rota 'login' (que não existe).
        // Essa config faz ele retornar JSON 401 em vez de redirecionar.
        $middleware->redirectGuestsTo(fn (Request $request) =>
            $request->expectsJson() ? null : '/login'
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API requests devem sempre retornar JSON, nunca redirect
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();

