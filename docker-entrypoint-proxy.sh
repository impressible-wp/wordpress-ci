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

# Go to the original entrypoint directory
cd /usr/src/wordpress

# Use a docker-specific version of wp-config by default.
# You may simply delete and overwrite the config if you want.
if [ -f ./wp-config.php ]; then
    ln -s ./wp-config-docker.php ./wp-config.php
fi

# Run the original entrypoint with the current working directory mounted
docker-entrypoint.sh $@

# Remember the original return code
RET=$?

# Go back to the original working directory
cd "$WORKDIR"

# Return the original return code
exit $RET