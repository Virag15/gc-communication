#!/usr/bin/env bash
set -e
cd /var/www/html

echo "[entrypoint] Booting GC Communication admin..."

# Ensure an application key exists (prefer one supplied via env / .env).
if [ -z "${APP_KEY:-}" ]; then
    export APP_KEY="$(php artisan key:generate --show)"
    echo "[entrypoint] WARNING: APP_KEY was not provided — generated an ephemeral key."
    echo "[entrypoint]          Set a persistent APP_KEY in .env for production."
fi

# Writable storage (the named volume can start empty) + public symlink.
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
         storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
php artisan storage:link --quiet 2>/dev/null || true

# Database — wait for it to accept connections, then migrate.
DB_CONNECTION="${DB_CONNECTION:-mysql}"
if [ "$DB_CONNECTION" = "sqlite" ]; then
    touch database/database.sqlite
fi

echo "[entrypoint] Running migrations..."
tries=0
until php artisan migrate --force --no-interaction; do
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
        echo "[entrypoint] Database unreachable after 30 attempts; starting anyway."
        break
    fi
    echo "[entrypoint] Waiting for database... ($tries/30)"
    sleep 2
done

# Optional first-run seed (set APP_SEED=true once, then remove it).
if [ "${APP_SEED:-false}" = "true" ]; then
    echo "[entrypoint] Seeding database..."
    php artisan db:seed --force --no-interaction || true
fi

# Production caches.
php artisan config:cache
php artisan event:cache || true
php artisan view:cache
php artisan route:cache || php artisan route:clear

echo "[entrypoint] Ready — GC Communication admin is starting."
exec "$@"
