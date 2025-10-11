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
    echo "Copying Wordpress source to /var/www/html..."
    cp -Rpdf /usr/src/wordpress/.htaccess /usr/src/wordpress/* /var/www/html
fi

# Use a docker-specific version of wp-config by default.
# You may simply delete and overwrite the config if you want.
if [ ! -f /var/www/html/wp-config.php ]; then
    echo "Setting up wp-config.php..."

    # Build the docker-specific wp-config file
    # from wp-config-docker.php
    #
    # Patch the wp-config.php to dynamically get home and siteurl
    # from $_SERVEFR['HTTP_HOST'] and $_SERVER['HTTPS'].
    # Add to the line before "Sets up WordPress vars and included files."
    CONFIG="/var/www/html/wp-config.php"
    head --lines="-2" /var/www/html/wp-config-docker.php > $CONFIG
    echo "" >> $CONFIG
    echo "/**" >> $CONFIG
    echo " * Dynamically set WP_HOME and WP_SITEURL" >> $CONFIG
    echo " */" >> $CONFIG
    echo "if ( isset( \$_SERVER['HTTP_HOST'] ) ) {" >> $CONFIG
    echo "    \$schema = isset( \$_SERVER['HTTPS'] ) && 'on' === \$_SERVER['HTTPS'] ? 'https' : 'http';" >> $CONFIG
    echo "    define( 'WP_HOME', \$schema . '://' . \$_SERVER['HTTP_HOST'] );" >> $CONFIG
    echo "    define( 'WP_SITEURL', \$schema . '://' . \$_SERVER['HTTP_HOST'] );" >> $CONFIG
    echo "}" >> $CONFIG
    echo "" >> $CONFIG
    tail --lines="2" /var/www/html/wp-config-docker.php >> $CONFIG
else
    echo "wp-config.php already exists in the Wordpress source, skipping setup."
fi

# If environment variables are set, use them to configure the database.
echo "Using wp-cli to setup the WordPress..."
wp core install \
    --url="http://localhost" \
    --title="${WORDPRESS_TITLE:-Wordpress\-Plugin\-CI}" \
    --admin_user="${WORDPRESS_ADMIN_USER:-user}" \
    --admin_password="${WORDPRESS_ADMIN_PASSWORD:-password}" \
    --admin_email="${WORDPRESS_ADMIN_EMAIL:-user@example.com}"

# Configure permalinks to use "Post name" structure.
wp rewrite structure '/%postname%/'

# Go to the original entrypoint directory
cd /usr/src/wordpress

# Run the original entrypoint with the current working directory mounted
echo "Starting the original entrypoint script..."
docker-entrypoint.sh $@

# Remember the original return code
RET=$?

# Go back to the original working directory
cd "$WORKDIR"

# Return the original return code
exit $RET