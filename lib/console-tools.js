'use strict'

// this extends string prototype
const colors = require('colors')

colors.setTheme({
  debug: 'blue',
  error: 'red',
  info: 'white',
  warn: 'yellow'
})

var util = require('util')

var preProcessMessage = function(message) {
  if (message === undefined) {
    return 'undefined'
  }

  if (message === null) {
    return 'null'
  }

  if (message instanceof Error) {
    return message
  }

  if (typeof message !== 'string') {
    message = message.toString()
  }

  return message
}

const info = function(message) {
  message = preProcessMessage(message)
  console.log(message.info)
}

const error = function(message) {
  message = preProcessMessage(message)
  console.log('× '.error + message.error)
}

const dataError = function(message) {
  message = preProcessMessage(message)
  console.log('Data Error: '.red + message.black.bgCyan)
}

const debug = function(message) {
  message = preProcessMessage(message)
  console.log(message.debug)
}

const done = function(message) {
  message = preProcessMessage(message)
  console.log('\t✓ '.green + message.white)
}

const doneBut = function(message) {
  message = preProcessMessage(message)
  console.log('\t✓ '.yellow + message.grey)
}

const warn = function(message) {
  message = preProcessMessage(message)
  console.log('\t○ '.warn + message.grey)
}

const fail = function(message) {
  message = preProcessMessage(message)
  console.log('× '.red + message.toString().red)

  if (message instanceof Error && message.stack) {
    console.log(message.stack.grey)
  }
}

const json = function(object, depth = 4) {
  var json = util.inspect(object, {
    depth: depth,
    colors: true
  })
  console.log(json.white)
}

const task = function(message) {
  message = preProcessMessage(message)
  console.log('★ '.yellow.bold + message.white)
}

/* utility methods */

const getJSON = function(object) {
  return util.inspect(object, {
    depth: 4,
    colors: true
  })
}

const log = {
  info,
  error,
  dataError,
  debug,
  done,
  doneBut,
  warn,
  fail,
  json,
  task
}

module.exports = { log, getJSON }
