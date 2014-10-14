'use strict';
var log = require('./console-tools');

var cheerio = require('cheerio')
    , colors = require('colors')
    , stringFormat = require('string-format');

//------------- impl with Promises
var Promise = require('bluebird');
//var join = Promise.join;
//var map = Promise.map;
//var reduce = Promise.reduce;
//var all = Promise.all;
//var req = Promise.promisify(require('request').defaults({jar: true}));
var req = Promise.promisify(require('request').defaults({jar: true}));

var urlParams = {year: 2014};
var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php';
var urls = [
        eventsSearchUrl + '?state=CN&race=Road&fyear={year}&rrfilter=rr&ajax=2'.format(urlParams) + '&cnt=0',
        eventsSearchUrl + '?state=CN&race=Road&fyear={year}&rrfilter=rr&ajax=2'.format(urlParams) + '&cnt=20',
        eventsSearchUrl + '?state=CN&race=Road&fyear={year}&rrfilter=rr&ajax=2'.format(urlParams) + '&cnt=40',
        eventsSearchUrl + '?state=CN&race=Road&fyear={year}&rrfilter=rr&ajax=2'.format(urlParams) + '&cnt=60',
        eventsSearchUrl + '?state=CN&race=Road&fyear={year}&rrfilter=rr&ajax=2'.format(urlParams) + '&cnt=80',
        eventsSearchUrl + '?state=CN&race=Road&fyear={year}&rrfilter=rr&ajax=2'.format(urlParams) + '&cnt=100'
];

var extractEvents = function(response) {
    var $ = cheerio.load(response.body);

    var $events = $('.event');
    var eventsCount = $events.length;

    var formattedMessage = '[{0} events] '.format(eventsCount) + response.request.uri.href;

    if (eventsCount >= 19) {
        log.done(formattedMessage);
    } else if (eventsCount == 0) {
        log.warn(formattedMessage);
    } else {
        log.doneBut(formattedMessage);
    }

    return $events;
};

log.task('Loading base url to get cookies');
req(eventsSearchUrl + '?state=CN&race=Road&fyear=2012&rrfilter=rr')
    .spread(function(response) { //using spread since it
        log.done(response.request.uri.href);
    })
    .then(function() {
        log.task('Loading events for year ' + urlParams.year.toString().italic);
        return Promise.map(urls,
            function(url) {
                return req(url).spread(extractEvents);
            });
    })
    .each(function($events) {
        //log.json($events.find('.title').first().text());
        $events.find('.title').each(function(index, element) {
            var $ =  cheerio.load(element);
            log.debug($(element).text());
        })

    })
//    .reduce(function(events, currentEvents) {
//        //log.json(events.find('.title').first().text());
//        log.json(currentEvents.find('.title'));
//
//        return events;
//    })
    .then(function(response) {
        //log.json(response);
    })
    .catch(function(err) {
        log.fail(err);
    });

//module exports
exports.awesome = function() {
    return 'awesome';
};

exports.scrapeEventsFor2014 = function(callback) {

};
