/*global describe,it*/
'use strict';

var scrapeUsacycling = require('../lib/scrape-usacycling.js');

describe('scrape-usacycling node module.', function() {
  it('must be awesome', function() {
  	scrapeUsacycling.awesome().should.equal('awesome')
  })
})

describe('running test module method', function() {
    describe('and nested option', function() {
        it('should be straightforward', function() {
            var x = 8;
            x.should.equal(8);
        })
    })
})
