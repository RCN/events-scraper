'use strict';
var log = require('./console-tools');

var cheerio = require('cheerio')
    , colors = require('colors')
    , stringFormat = require('string-format')
    , Promise = require('bluebird')
    , req = Promise.promisify(require('request').defaults({jar: true}))

//Promise.longStackTraces(); //Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.


var extractEvents = function(response) {
    var $ = cheerio.load(response.body);

    var $events = $('.event');
    var eventsCount = $events.length;

    var formattedMessage = '[{0} events] '.format(eventsCount) + response.request.uri.href;

    //usually it's no less then 19 events, yeah, pretty magic number
    if (eventsCount >= 19) {
        log.done(formattedMessage);
    } else if (eventsCount == 0) {
        log.warn(formattedMessage);
    } else {
        log.doneBut(formattedMessage);
    }

    return $events;
};

var urlParams = {
    fyear: 2014,
    state: 'CN',
    race: 'Road',
    rrfilter: 'rr'
};
var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php';
var parameterizedUrl = eventsSearchUrl + '?state={state}&race={race}&fyear={fyear}&rrfilter={rrfilter}&ajax=2'.format(urlParams);
var urls = [
        parameterizedUrl + '&cnt=0', //cnt param used for paging, means "start from event which number equals to 0"
        parameterizedUrl + '&cnt=20',
        parameterizedUrl + '&cnt=40',
        parameterizedUrl + '&cnt=60',
        parameterizedUrl + '&cnt=80',
        parameterizedUrl + '&cnt=100'
];

log.task('Loading base url to get cookies');
req(eventsSearchUrl + '?state=CN&race=Road&fyear=2012&rrfilter=rr')
    .spread(function spread(response) { //using spread since it
        log.done(response.request.uri.href);
    })
    .then(function then_load_events() {
        log.task('Loading events for year ' + urlParams.fyear.toString().italic);
        return Promise.map(urls,
            function extractEventsFor(url) {
                return req(url).spread(extractEvents);
            });
    })
    .each(function each($events) {
        //log.json($events.find('.title').first().text());
        log.debug($events.length);
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
        log.fail(err.stack);
    });

//module exports
exports.awesome = function() {
    return 'awesome';
};

