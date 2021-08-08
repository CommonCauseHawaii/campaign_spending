#!/bin/bash
set -o nounset                              # Treat unset variables as an error

jekyll build --config _deploy_config.yml
