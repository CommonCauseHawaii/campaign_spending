#!/bin/sh
git diff --exit-code >/dev/null
if [ $? -ne 0 ]; then
    echo "Requires a clean git directory"
    exit 1
fi

rm -rf _site/ doc/
bundle exec jekyll build --config _deploy_config.yml
cp -r _site/ doc/
git add --all doc/
