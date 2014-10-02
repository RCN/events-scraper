'use strict';

var colors = require('colors').setTheme({
    debug: 'blue',
    error: 'red',
    info: 'white',
    warn: 'yellow'
});

var preProcessMessage = function(message) {
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
    console.log(message.error);
};

exports.warn = function(message) {
    message = preProcessMessage(message);
    console.log(message.warn);
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

var log = this;

log.info('info');
log.error('error');
log.warn('warn');
log.debug('debug');
log.done('done');
log.fail('fail');


