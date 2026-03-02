#!/usr/bin/env bash

# Limpando caches pra evitar problemas de startup
php artisan optimize:clear

# O storage:link só cria atalho, pode dar erro se já existir, mas não para o script (|| true)
php artisan storage:link || true

# Como agora as variáveis de ambiente (conexão DB) da Render já estão disponíveis, 
# rodamos a migração OBRIGATÓRIA ANTES de colocar o site no ar:
php artisan migrate --force

# E colocamos tudo em cache agressivo de novo
php artisan route:cache
php artisan view:cache
php artisan config:cache

# Iniciar o servidor HTTP Apache no Container (Processo principal que manterá online)
apache2-foreground
