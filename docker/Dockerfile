ARG PHP_VERSION=8.1
FROM docker.io/library/php:${PHP_VERSION}-apache

# Run everything in a plugin folder
WORKDIR /var/www/html/wp-content/plugins/myplugin

# Copy the proxy entrypoint script and properly set permissions
COPY docker-entrypoint-proxy.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-proxy.sh

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

# Install MySQL client
RUN apt-get update && apt-get install -y default-mysql-client

# Use the proxy script to allow for custom entrypoints
ENTRYPOINT ["docker-entrypoint-proxy.sh"]
CMD ["apache2-foreground"]