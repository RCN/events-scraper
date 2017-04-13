import { log } from './console-tools'
// import _ from 'lodash'
import S from 'string'
S.extendPrototype()
import buildScraper from 'little-scraper'

import buildRequest from 'build-request'
const request = buildRequest({useCookies: true})

import extractEvents from 'scrapers/usac-events-scraper'
import buildEventUrls from 'scrapers/usac-events-url-builder'

const urls = buildEventUrls()
log.info('Crawling ' + urls.length + ' urls...')

const scrapeEventsFrom = buildScraper({
  writeResultsToFile: true,
  fileName: 'events/2016-2017_all-states_all-types_noncomp-0_rrfilter-rr',
  cacheIntermediateResultsToFile: false,
  scrapingFunc: extractEvents,
  delay: 500,
  concurrency: 1,
  request: request,
})

log.task('Loading base url to get cookies')
// parameters are not important as long as they are valid, making a request just to get cookies
request('https://www.usacycling.org/events/state_search.php?state=CN&race=Road&fyear=&rrfilter=rr')
  // using spread since it parses arguments list from array to plain ones
  .then(response => log.done(response.request.uri.href))
  .then(() => {
    log.task('Crawling...')
    return scrapeEventsFrom(urls)
  })

// TODO: if nothing helps, use rotating IP proxies
/*
  http://proxymesh.com/ $20 month, 20 ips a day
  http://shader.io/ more ips (pool of 100)
*/

//proxy mesh proxies (requires following header to be set on request:
  //'Proxy-Authorization': 'Basic ' + new Buffer('restuta8@gmail.com:<pwd>').toString('base64'))

// proxy: 'http://open.proxymesh.com:31280',
// proxy: 'http://au.proxymesh.com:31280',      //all blocked
// proxy: 'http://us-ca.proxymesh.com:31280',   //all blocked?
// proxy: 'http://us-ny.proxymesh.com:31280',   //all blocked?
// proxy: 'http://us-il.proxymesh.com:31280',   //all blocked?

// proxy: 'http://us-dc.proxymesh.com:31280',    //fast, some blocked
// proxy: 'http://us-fl.proxymesh.com:31280',    //fast, not blocked
// proxy: 'http://us.proxymesh.com:31280',      //fast, not blocked
// proxy: 'http://uk.proxymesh.com:31280',      //fast, not blocked
// proxy: 'http://ch.proxymesh.com:31280',      //fast, not blocked
// proxy: 'http://de.proxymesh.com:31280',      //fast, not blocked
// proxy: 'http://nl.proxymesh.com:31280',      //fast, not blocked
// proxy: 'http://sg.proxymesh.com:31280',      //slow, not blocked
