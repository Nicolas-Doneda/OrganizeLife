#!/usr/bin/env bash

echo "Limpando caches pra evitar problemas de startup"
php artisan optimize:clear || true

# O storage:link só cria atalho, pode dar erro se já existir, mas não para o script (|| true)
php artisan storage:link || true

# Tenta rodar as migrations com retry (para lidar com circuit breaker do Supabase)
echo "Aguardando banco de dados ficar disponivel..."
MAX_RETRIES=10
COUNT=0
MIGRATED=false
until php artisan migrate --force; do
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "AVISO: Falha ao migrar após $MAX_RETRIES tentativas. Iniciando servidor mesmo assim."
        MIGRATED=false
        break
    fi
    echo "Tentativa $COUNT/$MAX_RETRIES falhou. Aguardando 15 segundos..."
    sleep 15
done

# Cache de rotas/views/config (não bloqueia se falhar)
php artisan route:cache || true
php artisan view:cache || true
php artisan config:cache || true

# Iniciar o servidor HTTP Apache no Container (Processo principal que manterá online)
apache2-foreground