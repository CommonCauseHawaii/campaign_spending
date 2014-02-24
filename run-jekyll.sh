#!/bin/bash
set -o nounset                              # Treat unset variables as an error

jekyll build && cp _site/index.html .
