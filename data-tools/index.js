/* eslint-disable*/
//eslint is disabled to preserve babel config formatting that is easier to copy-paste from .babelrc

require('babel-register')({
  // see https://babeljs.io/docs/usage/options/#options for more config options
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


// require('./racers-in-memory-db')()
require('./bikereg-analysis')
