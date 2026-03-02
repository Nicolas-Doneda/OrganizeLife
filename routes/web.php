<?php

use Illuminate\Support\Facades\Route;

//EXPLICAÇÃO: Catch-all route para SPA React
//Qualquer URL que não seja /api/* é redirecionada para o app.blade.php
//O React Router cuida da navegação no frontend
//A ordem importa: essa rota DEVE ser a última (senão captura tudo)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
