'use strict';

var request = require('request').defaults({jar: true}),
    cheerio = require('cheerio'),
    colors = require('colors').setTheme({
        debug: 'blue',
        error: 'red',
        info: 'cyan'
    });

var Mocha = require('mocha'),
    Test = Mocha.Test,
    Suite = Mocha.Suite;
var should = require('should');

var mocha = new Mocha({
    timeout: 9999999
});
var suite = Suite.create(mocha.suite, 'Dynamic suite');
suite.addTest(new Test('I am a dynamic test', function(done) {
    setTimeout(done, 800);
    true.should.equal(true);
}));

suite.addTest(new Test('Another dymanic test 1', function(done) {
    setTimeout(done, 2000);
}));

suite.addTest(new Test('Another dymanic test 2', function(done) {
    setTimeout(done, 1500);
}));

suite.addTest(new Test('Another dymanic test 3', function(done) {
    setTimeout(done, 500);
}));

mocha.run(function() {
    console.log('done');
});

exports.awesome = function() {
  return 'awesome';
};

exports.scrapeEventsFor2014 = function(callback) {

};
