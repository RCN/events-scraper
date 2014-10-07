'use strict';
var log = require('./console-tools');

var request = require('request').defaults({jar: true}),
    requestp = require('request-promise').defaults({jar: true, resolveWithFullResponse: true}),
    cheerio = require('cheerio'),
    colors = require('colors');

//------------- impl with Promises
var Promise = require('bluebird');
//var join = Promise.join;
//var map = Promise.map;
//var reduce = Promise.reduce;
//var all = Promise.all;
//var req = Promise.promisify(require('request').defaults({jar: true}));
var req = Promise.promisify(require('request').defaults({jar: true}));

var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php';
var firstPageUrl = eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr&ajax=2' + '&cnt=0';
var secondPageUrl = eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr&ajax=2' + '&cnt=20';
var thirdPageUrl = eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr&ajax=2' + '&cnt=40';

var extractEvents = function(response) {
    log.done(response.request.uri.href);
    var $ = cheerio.load(response.body);
    return $('.event');
};


req(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr')
    .spread(function(response) { //using spread since it
        log.task('Loading base url to get cookies');
        log.done(response.request.uri.href);
    })
    .then(function() {
        log.task('Loading events');
        return Promise.all([
            req(firstPageUrl).spread(extractEvents),
            req(secondPageUrl).spread(extractEvents)
        ]);
    })
    .spread(function(response) {
          log.json(response);
//        log.debug(JSON.stringify(response, '', ''));
//        log.done(response.request.uri.href);
//        var $ = cheerio.load(response.body);
//        var $events = $('.event');
//        log.debug($events.length);

    })
    .catch(function(err) {
        log.fail(err);
    });

//req.getAsync(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr')
//    .then(function(error) {
//        log.done(error);
//    })
//    .error(function() {
//        log.fail('failed');
//    });

//------------- impl with Mocha >

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
                    throw new Exception();
                    var $ = cheerio.load(response.body);
                    var $events = $('.event');
                    $events.length.should.be.greaterThan(0);
                });
        }));
    })();
}

//mocha.run(function() {
//    console.log('done');
//});

//module exports
exports.awesome = function() {
    return 'awesome';
};

exports.scrapeEventsFor2014 = function(callback) {

};
