#!/bin/sh
git diff --exit-code >/dev/null
if [ $? -ne 0 ]; then
    echo "Requires a clean git directory"
    exit 1
fi

cp -r _site/ ../site-bak/
git checkout gh-pages
rm -r *
mv ../site-bak/* .
git add --all .
