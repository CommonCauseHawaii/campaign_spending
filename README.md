[![Vizualization Screenshot](_jekyll/images/viz-screenshot.png "Vizualization Screenshot")](http://viz.hawaiicampaignspending.com)
[![Vizualization Gif](_jekyll/images/screenshot.gif "Vizualization Gif")](http://viz.hawaiicampaignspending.com)

# Intro
This project is a vizualization of Hawaii Campaign Spending data for Candidates. It was initially created for [Civic*Celerator 2013](http://civic.celerator.org/).

[View Online](http://viz.hawaiicampaignspending.com)

Please note that this visualization is based on the official Hawaii Campaign
Spending data which you can find on data.hawaii.gov:
https://data.hawaii.gov/Community/Expenditures-Made-By-Hawaii-State-and-County-Candi/3maa-4fgr

But the data is actually pulled from a filtered/rolled-up view:
https://data.hawaii.gov/Community/Expenditures-Made-By-Hawaii-State-and-County-Candi/gvuk-nbsz/data

![Socrata Filter Settings](_jekyll/images/socrata_filter_settings.png "Socrata Filter Settings")

To better understand the data you should take a look at the [Campaign Finance Data Primer](https://docs.google.com/document/d/1VC0of6-rLtFrLmpBS8xWDLjLvtoPOr9LBfDJLYy_4fw/edit)

# Development/Contributing

## Installation/Running

    bundle install
    ./run-jekyll.sh
    ./jekyll-watch.sh

Visit http://localhost:4000 in a web browser

## Updating Data

In this project the data is updated manually rather than automatically fetched (this may change in the future).

    ./update_data.sh

Then commit the changes to the data (if any) and then deploy.

## Deploying

Run deploys script

    ./deploy.sh

Then commit the changes. The site is served from the master branch of the common cause repo: https://github.com/CommonCauseHawaii/campaign_spending

## Contributing

If you'd like to contribute, simply fork the repo, push your commits, and submit your pull request.
