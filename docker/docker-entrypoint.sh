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

# Find all plugins in the /usr/src/wordpress-ci/plugins directory
# and copy them to the WordPress plugins directory.
if [ -d /usr/src/wordpress-ci/plugins ]; then
  echo "Copying plugins to WordPress plugins directory..."
  for plugin_dir in /usr/src/wordpress-ci/plugins/*; do
    if [ -d "$plugin_dir" ]; then
      echo "Copying plugin: $(basename "$plugin_dir")"
      cp -Rpdf "$plugin_dir" /var/www/html/wp-content/plugins/
    fi
  done
else
  echo "No plugins directory found in /usr/src/wordpress-ci, skipping plugin copy."
fi

# Find all plugins in the /usr/src/wordpress-ci/plugins-mapped directory
# and symlink them to the WordPress plugins directory.
if [ -d /usr/src/wordpress-ci/plugins-mapped ]; then
  echo "Mapping plugins to WordPress plugins directory..."
  for plugin_dir in /usr/src/wordpress-ci/plugins-mapped/*; do
    if [ -d "$plugin_dir" ]; then
      echo "Mapping plugin: $(basename "$plugin_dir")"
      ln -s "$plugin_dir" /var/www/html/wp-content/plugins/$(basename "$plugin_dir")
    fi
  done
else
  echo "No plugins-mapped directory found in /usr/src/wordpress-ci, skipping plugin mapping."
fi

# Find all themes in the /usr/src/wordpress-ci/themes directory
# and copy them to the WordPress themes directory.
if [ -d /usr/src/wordpress-ci/themes ]; then
  echo "Copying themes to WordPress themes directory..."
  for theme_dir in /usr/src/wordpress-ci/themes/*; do
    if [ -d "$theme_dir" ]; then
      echo "Copying theme: $(basename "$theme_dir")"
      cp -Rpdf "$theme_dir" /var/www/html/wp-content/themes/
    fi
  done
else
  echo "No themes directory found in /usr/src/wordpress-ci, skipping theme copy."
fi

# Find all themes in the /usr/src/wordpress-ci/themes-mapped directory
# and symlink them to the WordPress themes directory.
if [ -d /usr/src/wordpress-ci/themes-mapped ]; then
  echo "Mapping themes to WordPress themes directory..."
  for theme_dir in /usr/src/wordpress-ci/themes-mapped/*; do
    if [ -d "$theme_dir" ]; then
      echo "Mapping theme: $(basename "$theme_dir")"
      ln -s "$theme_dir" /var/www/html/wp-content/themes/$(basename "$theme_dir")
    fi
  done
else
  echo "No themes-mapped directory found in /usr/src/wordpress-ci, skipping theme mapping."
fi

# Go to the original entrypoint directory
cd /usr/src/wordpress

# Run the original entrypoint with the current working directory mounted
echo "Starting the original entrypoint script..."
docker-php-entrypoint $@

# Go back to the original working directory
cd "$WORKDIR"
