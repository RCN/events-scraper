/* eslint-disable*/
//eslint is disabled to preserve babel config formatting that is easier to copy-paste from .babelrc

require('dotenv').config()

require('babel-register')({
  //see https://babeljs.io/docs/usage/options/#options for more config options
  babelrc: false,
  "presets": [
    ["env", {
      "targets": {
        "node": "current"
      }
    }]
  ],
  "plugins": [
    "transform-object-rest-spread"
  ],
})
require('babel-polyfill')
// require('./lib/scrapers/usac-results')
// require('./lib/scrapers/example-scraper');
// require('./lib/scrapers/usac-racers');
// require('./lib/scrapers/usac-events');
require('./lib/scrapers/usac-events-via-api');
// require('./lib/scrapers/bikereg/scrape-all')
