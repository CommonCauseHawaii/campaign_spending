#!/bin/sh
curl 'https://data.hawaii.gov/api/views/pefb-i73u/rows.csv?accessType=DOWNLOAD' -o expenditures.csv
curl 'https://data.hawaii.gov/api/views/5pbu-kqv9/rows.csv?accessType=DOWNLOAD' -o organizational_reports.csv
bundle exec ruby parse.rb
