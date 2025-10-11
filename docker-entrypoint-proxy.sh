#!/usr/bin/env bash

#
# This script is a proxy to the original docker-entrypoint.sh script.
#
# The original entrypoint script presumes that the current working directory
# is the Wordpress installation directory, which is not the case how a plugin
# developer wants.
#

# Get the current working directory
WORKDIR=$(pwd)

# Install Wordpress to the folder if it is not there.
if [ ! -f /var/www/html/wp-load.php ]; then
    echo "Installing Wordpress..."
    cp -Rpdf /usr/src/wordpress/.htaccess /usr/src/wordpress/* /var/www/html
fi

# Use a docker-specific version of wp-config by default.
# You may simply delete and overwrite the config if you want.
if [ ! -f /var/www/html/wp-config.php ]; then
    # Copy the docker-specific wp-config file
    cp -pdf /var/www/html/wp-config-docker.php /var/www/html/wp-config.php

    # Patch the wp-config.php to dynamically get home and siteurl
    # from $_SERVEFR['HTTP_HOST'] and $_SERVER['HTTPS'].
    # Add to the line before "Sets up WordPress vars and included files."
    head --lines="-2" /var/www/html/wp-config-docker.php > /var/www/html/wp-config.php
    echo "" >> /var/www/html/wp-config.php
    echo "/**" >> /var/www/html/wp-config.php
    echo " * Dynamically set WP_HOME and WP_SITEURL" >> /var/www/html
    echo " */" >> /var/www/html/wp-config.php
    echo "if ( isset( \$_SERVER['HTTP_HOST'] ) ) {" >> /var/www/html/wp-config.php
    echo "    \$schema = isset( \$_SERVER['HTTPS'] ) && 'on' === \$_SERVER['HTTPS'] ? 'https' : 'http';" >> /var/www/html/wp-config.php
    echo "    define( 'WP_HOME', \$schema . '://' . \$_SERVER['HTTP_HOST'] );" >> /var/www/html/wp-config.php
    echo "    define( 'WP_SITEURL', \$schema . '://' . \$_SERVER['HTTP_HOST'] );" >> /var/www/html/wp-config.php
    echo "}" >> /var/www/html/wp-config.php
    echo "" >> /var/www/html/wp-config.php
    tail --lines="2" /var/www/html/wp-config-docker.php >> /var/www/html/wp-config.php
fi

# If environment variables are set, use them to configure the database.
wp core install \
    --url="${WP_URL:-http://localhost:8080}" \    
    --title="${WP_TITLE:-Wordpress-CI}" \
    --admin_user="${WP_USER:-user}" \
    --admin_password="${WP_PASSWORD:-password}" \
    --admin_email="${WP_EMAIL:-user@example.com}"

# Go to the original entrypoint directory
cd /usr/src/wordpress

# Run the original entrypoint with the current working directory mounted
docker-entrypoint.sh $@

# Remember the original return code
RET=$?

# Go back to the original working directory
cd "$WORKDIR"

# Return the original return code
exit $RET