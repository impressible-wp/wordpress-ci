#!/usr/bin/env bash

#
# This script is a proxy to the original docker-entrypoint.sh script.
#
# The original entrypoint script presumes that the current working directory
# is the WordPress installation directory, which is not the case how a plugin
# developer wants.
#
set -o pipefail
set -ex

echo "Starting with environment variables:"
env

# Get the current working directory
WORKDIR=$(pwd)

# Install WordPress to the folder if it is not there.
if [ ! -f /var/www/html/wp-load.php ]; then
    echo "Copying WordPress source to /var/www/html..."
    cp -Rpdf /usr/src/wordpress/* /var/www/html
fi

# Use a docker-specific version of wp-config by default.
# You may simply delete and overwrite the config if you want.
if [ ! -f /var/www/html/wp-config.php ]; then
    echo "Setting up wp-config.php..."
    cp -pdf /usr/src/wordpress/wp-config-docker.php /var/www/html/wp-config.php
else
    echo "wp-config.php already exists in the WordPress source, skipping setup."
fi

# Check if database is up and running before continuing.
echo "Waiting for database to be ready..."
TIMEOUT=90
COUNTDOWN=$TIMEOUT
set +e  # Disable exit on error for the wait loop
while ! wp db check --allow-root --quiet; do
    sleep 1
    COUNTDOWN=$((COUNTDOWN - 1))
    if [ $COUNTDOWN -le 0 ]; then
        echo "Database is not ready after ${TIMEOUT_SETTING} seconds, exiting."
        exit 1
    fi
done
set -e  # Re-enable exit on error

# Check if the database should be clean on start
echo "Check if need to clean database on start: CLEAN_ON_START='$CLEAN_ON_START'"
if ! wp core is-installed --allow-root --quiet; then
  echo "WordPress is not installed yet, skipping database clean."
elif [ "$CLEAN_ON_START" != "" ]; then
  echo "Clean the database on start"
  wp db clean --yes
else
  echo "Not cleaning the database on start"
fi

# Check if an import SQL file is specified and present.
echo "IMPORT_SQL_FILE is set to: '$IMPORT_SQL_FILE'"
if [ "$IMPORT_SQL_FILE" != "" ] && [ -f "$IMPORT_SQL_FILE" ]; then
  echo "Importing database from SQL file: $IMPORT_SQL_FILE"
  echo "Will skip unattended installation."
  wp db import "$IMPORT_SQL_FILE"
elif wp core is-installed --allow-root --quiet; then
  # Check if WordPress is already installed.
  echo "WordPress is already installed, skipping setup."
else
  # If environment variables are set, use them to configure the database.
  echo "WordPress is not installed yet. Using wp-cli to perform unattended installation..."
  wp core install \
    --url="http://localhost" \
    --title="${WORDPRESS_TITLE:-WordPressCI}" \
    --admin_user="${WORDPRESS_ADMIN_USER:-user}" \
    --admin_password="${WORDPRESS_ADMIN_PASSWORD:-password}" \
    --admin_email="${WORDPRESS_ADMIN_EMAIL:-user@example.com}"
fi

# Check if the plugins should be copied or symlinked
if [ "$PLUGINS_COPIED" != "" ]; then
  echo "Copying plugins to the WordPress installation..."
  for plugin_path in /usr/src/wordpress-ci/plugins/*; do
    plugin_name=$(basename "$plugin_path")
    echo "Copying plugin: $plugin_name"
    cp -Rpdf "$plugin_path" "/var/www/html/wp-content/plugins/$plugin_name"
  done
else
  echo "Symlinking plugins to the WordPress installation..."
  for plugin_path in /usr/src/wordpress-ci/plugins/*; do
    plugin_name=$(basename "$plugin_path")
    echo "Symlinking plugin: $plugin_name"
    ln -s "$plugin_path" "/var/www/html/wp-content/plugins/$plugin_name"
  done
fi

# Check if the themes should be copied or symlinked
if [ "$THEMES_COPIED" != "" ]; then
  echo "Copying themes to the WordPress installation..."
  for theme_path in /usr/src/wordpress-ci/themes/*; do
    theme_name=$(basename "$theme_path")
    echo "Copying theme: $theme_name"
    cp -Rpdf "$theme_path" "/var/www/html/wp-content/themes/$theme_name"
  done
else
  echo "Symlinking themes to the WordPress installation..."
  for theme_path in /usr/src/wordpress-ci/themes/*; do
    theme_name=$(basename "$theme_path")
    echo "Symlinking theme: $theme_name"
    ln -s "$theme_path" "/var/www/html/wp-content/themes/$theme_name"
  done
fi

# Go to the original entrypoint directory
cd /usr/src/wordpress

# Run the original entrypoint with the current working directory mounted
echo "Starting the original entrypoint script..."
docker-php-entrypoint $@

# Go back to the original working directory
cd "$WORKDIR"
