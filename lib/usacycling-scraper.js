'use strict';
var log = require('./console-tools');

var cheerio = require('cheerio')
    , colors = require('colors')
    , stringFormat = require('string-format')
    , S = require('string').extendPrototype() //extend string prototype with methods from string package
    , Promise = require('bluebird')
    , req = Promise.promisify(require('request').defaults({jar: true}));


//Promise.longStackTraces(); //Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.


var parseDetailedAddress = function(addressString) {
    // e.g. "East Side of San Bruno Mtn<br>Brisbane, CA"

    var result = addressString || '';

    if (addressString.contains('<br>')) {
        result = addressString.replace('<br>', '\n').lines();
    } else {
        result = addressString.trim();
    }

    return result;
};

var scrapeCategory = function(tdContainingCategory){
    var category = '';

    //todo: use _ each or some other for each
    for(var i = 0; i < tdContainingCategory.children.length; i++){
        if (tdContainingCategory.children[i].type == 'text') {
            category = (tdContainingCategory.children[i].data || '').trim();
        }
    }

    return category;
};

var extractEvents = function(response) {
    var $ = cheerio.load(response.body);

    var $events = $('.event');
    var events = [];

    $events.each(function each(index, eventElement) {
        var $event = $(eventElement);
        var $eventDetailsSpan = $event.find('span.event_detail');
        var $eventDetailsDiv = $event.find('div.event_detail');
        var $linksInDetailsDivTd0 = $eventDetailsDiv.find('table td').eq(0).find('a');
        var $linksInDetailsDivTd1 = $eventDetailsDiv.find('table td').eq(1).find('a');
        var $linksInDetailsDivTd2 = $eventDetailsDiv.find('table td').eq(2).find('a');

        var event = {
            permit: $eventDetailsDiv.attr('id').chompLeft('permit_').toString(),
            title: $event.find('.title').text(),
            date: $eventDetailsSpan.find('span').text(),
            //using emulated DOM Node object to get text of the inner node, since $().text() gets text of all inner elements
            location: {
                cityState: $eventDetailsSpan[0].children[1].data.trim(),
                detailed: parseDetailedAddress($linksInDetailsDivTd0.eq(0).html()),
                googleMapsUrl: $linksInDetailsDivTd0.eq(0).attr('href')
            },
            eventWebSite: $linksInDetailsDivTd1.eq(2).attr('href'),
            promoter: {
                name: $linksInDetailsDivTd1.eq(0).text(),
                //todo: if relative link prefix with "https://www.usacycling.org"
                url: $linksInDetailsDivTd1.eq(0).attr('href')
            },

            //todo: status is not always extracted correctly
            status: $eventDetailsDiv.find('table td font').text(),
            //getting 4th DOM Node element, which is "text" for table's third td
            //category: ($eventDetailsDiv.find('table td').get(2).children[3].data || '').trim()
            category: scrapeCategory($eventDetailsDiv.find('table td').get(2))
        };
        log.json(event);
    });

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

    return $events.length;
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
//        parameterizedUrl + '&cnt=20',
//        parameterizedUrl + '&cnt=40',
//        parameterizedUrl + '&cnt=60',
//        parameterizedUrl + '&cnt=80',
//        parameterizedUrl + '&cnt=100',
//        parameterizedUrl + '&cnt=120',
//        parameterizedUrl + '&cnt=140'
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
//    .each(function each($events) {
//        log.debug($events.length);
//    })
    .reduce(function(events, currentEvents) {
        return events + currentEvents;
    })
    .then(function(eventsCount) {
        log.json(eventsCount);
    })
    .catch(function(err) {
        log.fail(err.stack);
    });

//module exports
exports.awesome = function() {
    return 'awesome';
};

/*
    todo idea: this is how this should work
        - promise based solution that accepts
            - array of urls to load
            - (possibly) urls to get sequentially first
            - (optionally) number of queries to do in parallel
            - (possibly) some state for requests (to share cookies etc)
            - parsing function that returns single object or array
            - automatically map and reduce results from parsing function to one collection of objects or combined arrays
        - so module would abstract promise related task management, possible API:
            var results = scrape(urls, {parallel: 5}, parsingFunc);
            var events = req(url).thenScrape(eventUrls, extractEventInfo);
 */

