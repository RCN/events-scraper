/*global describe,it*/
'use strict';

var request = require('request').defaults({jar: true}),
    requestp = require('request-promise').defaults({jar: true}),
    cheerio = require('cheerio'),
    colors = require('colors').setTheme({
        debug: 'blue',
        error: 'red',
        info: 'cyan'
    });

describe('When calling to "https://www.usacycling.org/events/state_search.php"', function() {
    describe('with the following parameters "?state=CN&race=Road&fyear=2014&rrfilter=rr&ajax=2"', function() {

        var $;

        it('should return exactly 19 events', function(done) {
            var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php';
            requestp(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr')
                .then(function() {
                    return requestp(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr'+ '&ajax=2');
                })
                .then(function(response) {
                    $ = cheerio.load(response);
                    var $events = $('.event');
                    $events.length.should.equal(19);
                })
                .done(function() {
                    done();
                });

//            //calling it for the first time to get needed cookies
//            request(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr', function(error, response, body) {
//                //calling with 'ajax=2' parameter to get only html event's data
//                request(eventsSearchUrl + '?state=CN&race=Road&fyear=2014&rrfilter=rr' + '&ajax=2', function(error, response, body) {
//                    $ = cheerio.load(body);
//                    var $events = $('.event');
//                    $events.length.should.equal(19);
//                    done();
//                })
//            })
        })

//        describe('for each element', function() {
//            $('.event a.title.ttip').forEach(function(item) {
//                it(item.text(), function() {
//                    assert.ok();
//                })
//            })
//        })


        it('first event should be "2014 San Bruno Mountain Hill Climb"', function() {
            $('.event a.title.ttip').first().text().should.equal('2014 San Bruno Mountain Hill Climb');
        })
    })
});
