# syntax=docker/dockerfile:1.7
#
# GC Communication — admin panel
# Multi-stage production image: Vite build → Composer deps → php-fpm + nginx runtime.
# Result: a single self-contained image you can run anywhere with `docker compose up`.

############################################
# Stage 1 — Build the front-end with Vite  #
############################################
FROM node:24-alpine AS frontend
WORKDIR /app

# Install JS deps against the lockfile (cache-friendly layer)
COPY package.json package-lock.json ./
RUN npm ci

# Build assets (runs `tsc --noEmit && vite build` per package.json)
COPY tsconfig.json vite.config.ts components.json ./
COPY resources ./resources
COPY public ./public
RUN npm run build


############################################
# Stage 2 — Install PHP deps with Composer #
############################################
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --prefer-dist \
        --no-interaction \
        --no-progress \
        --optimize-autoloader


############################################
# Stage 3 — Runtime (php-fpm + nginx)      #
############################################
FROM php:8.4-fpm-alpine AS runtime
WORKDIR /var/www/html

# Runtime libraries + build deps for PHP extensions
RUN apk add --no-cache \
        bash nginx supervisor \
        icu-libs libzip libpng libjpeg-turbo freetype \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS icu-dev libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql mbstring bcmath intl zip gd exif opcache pcntl \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/*

# Application source
COPY . .

# Vendored PHP packages + compiled front-end from earlier stages
COPY --from=vendor   /app/vendor       ./vendor
COPY --from=frontend /app/public/build ./public/build

# Container configuration
COPY docker/php.ini        /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php-fpm.conf   /usr/local/etc/php-fpm.d/zz-www.conf
COPY docker/nginx.conf     /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh  /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/entrypoint \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && rm -rf node_modules

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://127.0.0.1/up >/dev/null 2>&1 || exit 1

ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
