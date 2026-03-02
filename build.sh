#!/usr/bin/env bash

# Para o script se algum comando falhar
set -e

echo "Instalando dependencias PHP..."
composer install --no-dev --optimize-autoloader

echo "Instalando dependencias Node (Frontend)..."
npm install

echo "Gerando a build de produção do React (Vite)..."
npm run build
