'use strict';

var request = require('request').defaults({jar: true}),
    requestp = require('request-promise').defaults({jar: true, resolveWithFullResponse: true}),
    cheerio = require('cheerio'),
    bluebird = require('bluebird'),
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
    timeout: 9999999,
    bail: false
});

var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php';
var suite = Suite.create(mocha.suite, 'Scraping Events for USA Cycling, ' + eventsSearchUrl);
//todo restuta: redo below mocha version with promises, see bluebird docs https://github.com/petkaantonov/bluebird


suite.addTest(new Test('loaded initial HTML and got cookies (?state=CN&race=Road&fyear=2014&rrfilter=rr)', function() {
    return requestp(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr');
}));

for (var i = 0; i <= 90; i += 20) {
    //creating a scope to be able to use i inside a closure, see: http://stackoverflow.com/questions/13813463/how-to-avoid-access-mutable-variable-from-closure
    (function() {
        var currentFirstEventNumber = (i > 0) ? i - 20 : 0;
        var eventsUrl = eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr' + '&ajax=2' + '&cnt=' + i;

        suite.addTest(new Test('loaded events ' + currentFirstEventNumber + '-' + (i + 19) + ' (' + eventsUrl + ')', function() {
            return requestp(eventsUrl)
                .then(function(response) {
                    var $ = cheerio.load(response.body);
                    var $events = $('.event');
                    $events.length.should.be.greaterThan(0);
                });
        }));
    })();
}

console.log('✓'.green);

mocha.run(function() {
    console.log('done');
});

//module exports
exports.awesome = function() {
    return 'awesome';
};

exports.scrapeEventsFor2014 = function(callback) {

};
