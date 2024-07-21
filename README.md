# Mission to Mars Dashboard - V.3

[![Netlify Status](https://api.netlify.com/api/v1/badges/72cfece8-c2c6-4e11-a253-118373617c4e/deploy-status)](https://app.netlify.com/sites/missiontomarsdash/deploys)

This is an updated Mission to Mars Dashboard, built for longevity. It is a small html/css/js site wrapped in Jekyll for basic developer niceties, hacked together in an afternoon. 

Once generated, the built site will work for as long as web browsers exisit. It uses Bootstrap and jQueary for layouts and UI updates. Chart.js is used for charts, with all of these included within the project files to allow for offline use of built website. For simplicity.

There is no database. Missions are restricted to the browser used.

The current main branch build is available at [missiontomarsdash.netlify.app/](https://missiontomarsdash.netlify.app/);

## Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Usage](#usage)
- [Deployment](#deployment)
- [Heritage](#heritage)
- [Contributing](#contributing)

## Installation

You'll need the following installed:

- Ruby

With those installed, cd into the projects root directory and run `bundle` to install dependencies.

Be warned, Ruby and Windows often don't get along, but this site is simple enough that things should be fine. Time will tell.

## Development

From the projects root directory and run `bundle exec jekyll serve` to generate the satic website and watch for file changes. You can view the website at [http://localhost:4000/](http://localhost:4000/).

Changes to files will trigger a rebuild. Refresh your browser to see the updates. Any alterations to the `_config` file will require restarting the server.

If making more than minor changes, see the contributing section before going further.

## Usage

The current main branch build is available at [missiontomarsdash.netlify.app/](https://missiontomarsdash.netlify.app/);

If your working locally, the most recently built version of the application can be found in the `/_site` folder. This is the folder you can copy else where, and double click the `index.html` page to launch the dashboard. You'll only need a web browser. If you can't use the live hosted site during a mission, this is how the dashboard should be used.

## Deployment

Any pushes to the main branch on GitHub will trigger a fresh build and release to the live website.

If needed, this site can be hosted with any provider that is suitable for use Static Site Generators, and most are free. The majority are as simple as pointing the platform at this repository to setup.

## Heritage

The Mission to Mars dashboard was originally built by [Barry Rhodes](https://github.com/bjrhodes), and updated and generally kept alive by [Tony Edwards](https://github.com/tonyedwardspz/). 

The first dashboard upgrade was by [Liam Cornbill](https://github.com/LiamCornbill), with the current version created by [Tony Edwards](https://github.com/tonyedwardspz/).

[Liam Cornbill](https://github.com/LiamCornbill) also wrote the Core Coin tracker part of the dashboard as a seperate project. It was integrated into the application in the most recent upgrade.


## Contributing

Contributions to the project are welcome, in keeping with the community spirit of Mission to Mars.

To make a contribution:

- create a fork of the project
- make your changes
- create a pull request against the original repository
