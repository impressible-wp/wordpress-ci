#!/bin/bash

wp-cli --allow-root "$@"

exit $?
