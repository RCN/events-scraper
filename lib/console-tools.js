'use strict';

var colors = require('colors').setTheme({
    debug: 'blue',
    error: 'red',
    info: 'white',
    warn: 'yellow'
});

var preProcessMessage = function(message) {
    if(message === undefined) {
        return 'undefined';
    }

    if (typeof message !== 'string') {
        message = message.toString();
    }

    return message;
};

exports.info = function(message) {
    message = preProcessMessage(message);
    console.log(message.info);
};

exports.error = function(message) {
    message = preProcessMessage(message);
    console.log('♡ '.error + message.error);
};

exports.warn = function(message) {
    message = preProcessMessage(message);
    console.log('⚠ '.warn + message.warn);
};

exports.debug = function(message) {
    message = preProcessMessage(message);
    console.log(message.debug);
};

exports.done = function(message) {
    message = preProcessMessage(message);
    console.log('    ✓'.green + ' ' + message.grey);
};

exports.fail = function(message) {
    message = preProcessMessage(message);
    console.log('    ×'.red + ' ' + message.grey);
};

exports.json = function(object) {
    var json = JSON.stringify(object, ' ', ' ');
    console.log(json.white);
};

exports.task = function(message) {
    message = preProcessMessage(message);
    console.log('★ '.yellow.bold + message.white);
};

//example:

//var log = this;
//
//log.info('info');
//log.error('error');
//log.warn('warn');
//log.debug('debug');
//log.done('done');
//log.fail('fail');
//log.json({a:'bla'});
//log.task('task');


