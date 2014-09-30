/*global describe,it*/
'use strict';

var usaCyclingScraper = require('../lib/usacycling-scraper.js');

describe('scrape-usacycling node module.', function() {
  it('must be awesome', function() {
  	usaCyclingScraper.awesome().should.equal('awesome')
  })
})

describe('running test module method', function() {
    describe('and nested option', function() {
        it('should be straightforward', function() {
            var x = 8;
            x.should.equal(8);
            usaCyclingScraper.scrapeEventsFor2014();
        })
    })
})
