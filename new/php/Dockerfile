FROM php:8.2-fpm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       libsqlite3-dev \
       pkg-config \
  && docker-php-ext-configure pdo_sqlite \
  && docker-php-ext-install pdo_sqlite \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

CMD ["php-fpm"]
