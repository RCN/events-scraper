'use strict'

// this extends string prototype
require('colors').setTheme({
  debug: 'blue',
  error: 'red',
  info: 'white',
  warn: 'yellow'
})

var util = require('util')
var argv = require('yargs').argv

var preProcessMessage = function (message) {
  if (message === undefined) {
    return 'undefined'
  }

  if (message === null) {
    return 'null'
  }

  if (typeof message !== 'string') {
    message = message.toString()
  }

  return message
}

exports.info = function (message) {
  message = preProcessMessage(message)
  console.log(message.info)
}

exports.error = function (message) {
  message = preProcessMessage(message)
  console.log('× '.error + message.error)
}

exports.dataError = function (message) {
  message = preProcessMessage(message)
  console.log('Data Error: '.red + message.black.bgCyan)
}

exports.debug = function (message) {
  message = preProcessMessage(message)
  console.log(message.debug)
}

exports.done = function (message) {
  message = preProcessMessage(message)
  console.log('\t✓ '.green + message.white)
}

exports.doneBut = function (message) {
  message = preProcessMessage(message)
  console.log('\t✓ '.yellow + message.grey)
}

exports.warn = function (message) {
  message = preProcessMessage(message)
  console.log('\t○ '.warn + message.grey)
}

exports.fail = function (message) {
  message = preProcessMessage(message)
  console.log('\t× '.red + message.grey)
}

exports.json = function (object, depth = 2) {
  var json = util.inspect(object, {
    depth: depth,
    colors: true
  })
  console.log(json.white)
}

exports.task = function (message) {
  message = preProcessMessage(message)
  console.log('★ '.yellow.bold + message.white)
}

/* utility methods */

exports.getJSON = function (object) {
  return util.inspect(object, {
    depth: 2,
    colors: true
  })
}

if (argv.test) {
  var log = this

  log.info('info')
  log.error('error')
  log.dataError('some invalid data')
  log.warn('warn')
  log.debug('debug')
  log.done('done')
  log.doneBut('doneBut')
  log.fail('fail')
  log.json({a: 'bla'})
  log.task('task')
}
