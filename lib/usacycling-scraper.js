'use strict';

var request = require('request').defaults({jar: true}),
    cheerio = require('cheerio'),
    colors = require('colors').setTheme({
        debug: 'blue',
        error: 'red',
        info: 'cyan'
    });

exports.awesome = function() {
  return 'awesome';
};

exports.scrapeEventsFor2014 = function(callback) {
    var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php';
    request(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr', function(error, response, body) {
        request(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr' + '&ajax=2', function(error, response, body) {
            var $ = cheerio.load(body);
            var totalEvents = $('.event').length;

            callback({totalEvents: totalEvents});
        })
    })
};
