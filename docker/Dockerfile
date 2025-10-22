# Allow to override what PHP version image to base on
ARG PHP_VERSION=8.1
FROM docker.io/library/php:${PHP_VERSION}-apache

# Allow to override what Wordpress version to install
ARG WORDPRESS_VERSION=latest

# Run everything in a plugin folder
WORKDIR /var/www/html/wp-content

# Copy the proxy entrypoint script and properly set permissions
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set php.ini settings
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Install wp-cli
COPY wp-cli-proxy.sh /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp
RUN curl -o /usr/local/bin/wp-cli -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
RUN chmod +x /usr/local/bin/wp-cli

# Install composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN curl -o - https://composer.github.io/installer.sha384sum | sha384sum --check
RUN php composer-setup.php --install-dir=/usr/local/bin --filename=composer
RUN php -r "unlink('composer-setup.php');"

# Download the latest Wordpress core to the source folder
RUN mkdir -p /usr/src/wordpress
RUN wp core download --allow-root --path=/usr/src/wordpress --version=${WORDPRESS_VERSION}
COPY wp-config-docker.php /usr/src/wordpress/wp-config-docker.php

# Install MySQL client and other dependencies
# default-mysql-client: needed for any mysql operation
# libzip-dev, libpng-dev, libjpeg-dev, libfreetype6-dev: required for gd
# libonig-dev: required for mbstring
# less: required for some wp-cli command
RUN apt-get update && apt-get install -y default-mysql-client libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libonig-dev less
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions and other dependencies
RUN docker-php-ext-install gd mbstring pdo pdo_mysql mysqli zip

# Enable mod_rewrite for Apache and wp-cli
RUN a2enmod rewrite
RUN mkdir -p ~/.wp-cli; echo "apache_modules:\n  - mod_rewrite" > ~/.wp-cli/config.yml

# Properly label the image
LABEL org.opencontainers.image.title="Wordpress CI (php${PHP_VERSION})"
LABEL org.opencontainers.image.authors="Koala Yeung <koala@example.com>"
LABEL org.opencontainers.image.url="https://github.com/orgs/impressible-wp/packages/container/package/wordpress-ci"
LABEL org.opencontainers.image.source="https://github.com/impressible-wp/wordpress-ci/tree/main/docker"
LABEL org.opencontainers.image.version="php${PHP_VERSION}"
LABEL org.opencontainers.image.description="A Docker image for Wordpress development with Wordpress ${WORDPRESS_VERSION} and PHP ${PHP_VERSION}"
LABEL org.opencontainers.image.licenses="MIT"

# Use the proxy script to allow for custom entrypoints
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
