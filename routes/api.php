<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RecurringBillController;
use App\Http\Controllers\Api\MonthlyBillController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IncomeController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

//============================================================
//  ROTAS PÚBLICAS (não precisam de autenticação)
//============================================================

//EXPLICAÇÃO:
//  Essas rotas ficam FORA do middleware auth:sanctum
//  Qualquer pessoa pode acessar (senão ninguém conseguiria criar conta ou logar!)
//  Rate limiting: 5 tentativas por minuto para evitar abuso

Route::middleware('throttle:5,1')->group(function () {
    //Registro e Login
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    //Recuperação de senha
    //EXPLICAÇÃO: Essas rotas são públicas porque o usuário ESQUECEU a senha
    //Se exigíssemos login, ele nunca conseguiria usar!
    Route::post('auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('auth/reset-password', [PasswordResetController::class, 'resetPassword']);
});

//============================================================
//  ROTAS 2FA (acessíveis com temp_token limitado)
//============================================================

//EXPLICAÇÃO: Essas rotas só precisam do temp_token (com ability '2fa:verify')
//O temp_token é gerado no login quando 2FA está ativo
//IMPORTANTE: ficam FORA do grupo principal para não exigir token completo
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/2fa/verify', [TwoFactorController::class, 'verify']);
    Route::post('auth/2fa/recovery', [TwoFactorController::class, 'recovery']);
});

//============================================================
//  ROTAS PROTEGIDAS (precisam de token Sanctum com abilities completas)
//============================================================

//EXPLICAÇÃO: O middleware 'ability:*' garante que o token tem TODAS as abilities
//Isso impede que o temp_token do 2FA (que só tem '2fa:verify') acesse essas rotas
Route::middleware(['auth:sanctum', 'ability:*'])->group(function () {

    //AUTH - Rotas do usuário autenticado
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });

    //2FA - Configurações (enable, confirm, disable)
    //EXPLICAÇÃO: Diferente de verify/recovery, essas rotas precisam de token COMPLETO
    //Porque são para CONFIGURAR o 2FA, não para verificar no login
    Route::prefix('auth/2fa')->group(function () {
        Route::post('/enable', [TwoFactorController::class, 'enable']);
        Route::post('/confirm', [TwoFactorController::class, 'confirm']);
        Route::delete('/disable', [TwoFactorController::class, 'disable']);
    });

    //DASHBOARD
    Route::prefix('dashboard')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/history', [DashboardController::class, 'history']);
    });

    //CATEGORIAS (CRUD padrão)
    //EXPLICAÇÃO:
    //  apiResource() cria automaticamente 5 rotas:
    //  GET    /api/categories          → index   (listar)
    //  POST   /api/categories          → store   (criar)
    //  GET    /api/categories/{id}     → show    (exibir)
    //  PUT    /api/categories/{id}     → update  (atualizar)
    //  DELETE /api/categories/{id}     → destroy (deletar)
    Route::apiResource('categories', CategoryController::class);

    //CONTAS RECORRENTES (CRUD + ações customizadas)
    Route::apiResource('recurring-bills', RecurringBillController::class);
    Route::patch('recurring-bills/{id}/activate', [RecurringBillController::class, 'activate']);
    Route::patch('recurring-bills/{id}/deactivate', [RecurringBillController::class, 'deactivate']);

    //CONTAS MENSAIS (CRUD + ações de status)
    Route::apiResource('monthly-bills', MonthlyBillController::class);
    Route::patch('monthly-bills/{id}/pay', [MonthlyBillController::class, 'markAsPaid']);
    Route::patch('monthly-bills/{id}/pending', [MonthlyBillController::class, 'markAsPending']);
    Route::patch('monthly-bills/{id}/overdue', [MonthlyBillController::class, 'markAsOverdue']);
    Route::patch('monthly-bills/{id}/cancel', [MonthlyBillController::class, 'cancel']);

    //INCOMES (CRUD + receive)
    Route::apiResource('incomes', IncomeController::class);
    Route::patch('incomes/{id}/receive', [IncomeController::class, 'receive']);

    //EVENTOS (CRUD + upcoming)
    //IMPORTANTE: rota customizada ANTES do apiResource para nao conflitar com {id}
    Route::get('events/upcoming', [EventController::class, 'upcoming'])
        ->name('events.upcoming');
    Route::apiResource('events', EventController::class);

    //CARTEIRAS (CRUD padrão)
    Route::apiResource('wallets', WalletController::class);
});
