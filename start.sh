#!/usr/bin/env bash

# Para o script se algum comando falhar
set -e

echo "Limpando caches pra evitar problemas de startup"
php artisan optimize:clear

# O storage:link só cria atalho, pode dar erro se já existir, mas não para o script (|| true)
php artisan storage:link || true

# Tenta rodar as migrations com retry (para lidar com circuit breaker do Supabase)
echo "Aguardando banco de dados ficar disponivel..."
MAX_RETRIES=10
COUNT=0
until php artisan migrate --force; do
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Falha ao conectar ao banco após $MAX_RETRIES tentativas. Abortando."
        exit 1
    fi
    echo "Tentativa $COUNT/$MAX_RETRIES falhou. Aguardando 15 segundos..."
    sleep 15
done

echo "Migrations concluídas com sucesso!"

# E colocamos tudo em cache agressivo de novo
php artisan route:cache
php artisan view:cache
php artisan config:cache

# Iniciar o servidor HTTP Apache no Container (Processo principal que manterá online)
apache2-foreground