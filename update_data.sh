#!/bin/sh

# Rolled up data set for expenditures
# https://hicscdata.hawaii.gov/dataset/Hawaii-Campaign-Spending-Rollup/9g8z-ggqz/data
curl 'https://hicscdata.hawaii.gov/resource/9g8z-ggqz.csv?$limit=100000' -u "$API_KEY_ID:$API_KEY_SECRET" -o raw_data/expenditures.csv

curl 'https://hicscdata.hawaii.gov/resource/8ry8-ip7m.csv?$limit=50000' -u "$API_KEY_ID:$API_KEY_SECRET" -o raw_data/organizational_reports.csv
