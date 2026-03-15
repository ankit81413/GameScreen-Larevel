FROM php:8.2-cli AS app-builder

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git unzip curl supervisor \
    libzip-dev libpng-dev libonig-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_mysql zip
RUN { \
    echo "upload_max_filesize=512M"; \
    echo "post_max_size=512M"; \
    echo "max_file_uploads=50"; \
    echo "max_execution_time=600"; \
    echo "max_input_time=600"; \
    echo "memory_limit=512M"; \
} > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=node:20-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:20-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm ci
RUN npm run build
RUN rm -rf node_modules

FROM php:8.2-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    supervisor \
    libzip-dev libpng-dev libonig-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_mysql zip
RUN { \
    echo "upload_max_filesize=512M"; \
    echo "post_max_size=512M"; \
    echo "max_file_uploads=50"; \
    echo "max_execution_time=600"; \
    echo "max_input_time=600"; \
    echo "memory_limit=512M"; \
} > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=app-builder /var/www /var/www

RUN php artisan storage:link --force

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
