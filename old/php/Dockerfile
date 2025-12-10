FROM php:8.2-fpm-alpine

RUN apk add --no-cache sqlite-dev \
 && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite=/usr \
 && docker-php-ext-install pdo_sqlite

WORKDIR /var/www/html

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
