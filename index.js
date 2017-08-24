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
  // "plugins": ["add-module-exports"],
})
require('babel-polyfill')
// require('./lib/scrapers/bikereg')
// require('./lib/scrapers/example-scraper');
require('./lib/scrapers/usac-racers');
