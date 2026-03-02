#!/usr/bin/env bash

# Para o script se algum comando falhar
set -e

echo "Instalando dependencias PHP..."
composer install --no-dev --optimize-autoloader

echo "Limpando caches antigos..."
php artisan optimize:clear

echo "Instalando dependencias Node (Frontend)..."
npm install

echo "Gerando a build de produção do React (Vite)..."
npm run build

echo "Rodando as Migrations do banco de dados (Tabelas)..."
php artisan migrate --force

echo "Criando link simbolico do Storage (Imagens)..."
php artisan storage:link || true

echo "Otimizando rotas e views para produção..."
php artisan route:cache
php artisan view:cache
php artisan config:cache
