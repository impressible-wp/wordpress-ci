FROM docker.io/library/wordpress:apache

# Run everything in a plugin folder
WORKDIR /usr/src/wordpress/wp-content/plugins/plugin

# Copy the proxy entrypoint script and properly set permissions
COPY docker-entrypoint-proxy.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-proxy.sh

# Install wp-cli
COPY wp-cli-proxy.sh /usr/local/bin/wp
RUN chmod +x /usr/local/bin/wp
RUN curl -o /usr/local/bin/wp-cli -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
RUN chmod +x /usr/local/bin/wp-cli

# Use the proxy script to allow for custom entrypoints
ENTRYPOINT ["docker-entrypoint-proxy.sh"]
CMD ["apache2-foreground"]