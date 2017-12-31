#!/bin/sh
curl 'https://data.hawaii.gov/resource/gvuk-nbsz.csv?$limit=100000' -o expenditures.csv
curl 'https://data.hawaii.gov/resource/5pbu-kqv9.csv?$limit=50000' -o organizational_reports.csv
bundle exec ruby parse.rb
