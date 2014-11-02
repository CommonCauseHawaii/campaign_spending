#!/bin/sh
git diff --exit-code >/dev/null
if [ $? -ne 0 ]; then
    echo "Requires a clean git directory"
    exit 1
fi

rm -r _site/
bundle exec jekyll build --config _deploy_config.yml
cp -r _site/ ../site-bak/
git checkout gh-pages
rm -r *
mv ../site-bak/* .
git add --all .
