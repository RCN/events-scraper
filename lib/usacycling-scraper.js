'use strict';
var log = require('./console-tools');

var cheerio = require('cheerio')
    , colors = require('colors')
    , stringFormat = require('string-format')
    , S = require('string').extendPrototype() //extend string prototype with methods from string package
    , moment = require('moment')
    , Promise = require('bluebird')
    , req = Promise.promisify(require('request').defaults({jar: true}))
    , _ = require('lodash');

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

//scrapes race category
var scrapeCategory = function(tdContainingCategory) {
    var category = '';

    //todo: use _ each or some other for each
    //using "children" property, since tdContainingCategory is cheerio object, in DOM it would be "childNodes"
    for (var i = 0; i < tdContainingCategory.children.length; i++) {
        if (tdContainingCategory.children[i].type == 'text') {
            category = (tdContainingCategory.children[i].data || '').trim();
        }
    }

    return category;
};

//scrapes event dates, could be one or many in case of multi-day events, returns array in any case
var scrapeDate = function(tdContainingCategory) {
    for (var i = 0; i < tdContainingCategory.children.length; i++) {
        if (tdContainingCategory.children[i].type == 'text') {
            var datesString = (tdContainingCategory.children[i].data || '').trim();
            var rawDates;
            var multiDayEvent = datesString.contains(' - ');

            if (multiDayEvent) {
                rawDates = datesString.split(' - ');
            } else {
                rawDates = [datesString];
            }

            var dates = _.map(rawDates, function(item) { return moment(new Date(item)); });

            if (_.every(dates, function(date) { return date.isValid(); })) {
                return _.map(dates, function(date) { return date.toISOString(); });
            }
        }
    }

    //todo: add error message here with context object
    log.json(tdContainingCategory);
    return [];
};

//todo: rename data param to something more meaningful
var extractEvents = function(params) {
    var $ = cheerio.load(params.response.body);
    var year = params.year;
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
            dates: scrapeDate($eventDetailsDiv.find('table td').get(0)),
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
            category: scrapeCategory($eventDetailsDiv.find('table td').get(2)) //table's third td
        };
        log.json(event);
    });

    var eventsCount = $events.length;
    var formattedMessage = '[{0} events] '.format(eventsCount) + params.response.request.uri.href;

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
    .spread(function then_print_url(response) { //using spread since it parses arguments list from array to plain ones
        log.done(response.request.uri.href);
    })
    .then(function then_load_events() {
        log.task('Loading events for year ' + urlParams.fyear.toString().italic);
        return Promise.map(
            urls,
            function extractEventsFor(url) {
                return req(url)
                    .spread(function spread(response) {
                        return extractEvents({
                            response: response,
                            year: urlParams.fyear
                        });
                    });
            });
    })
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
 todo problems with UsaCycling:
 - currently there are some duplicates of the events
 - need to be able to compare events on equality
 - simplest thing would be co compare by permit-id: but this needs to be confirmed that there are no different events
 under same permit
 - what to do with multiday events? array of dates?

 */

