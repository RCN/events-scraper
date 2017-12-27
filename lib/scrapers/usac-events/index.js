import { log } from 'console-tools'
import R from 'ramda'
import RS from 'ramda-sheep'
// import buildScraper from 'little-scraper'
import buildScraper from 'scrapers/utils/scraper-with-proxy'

import buildRequest from 'build-request'
const request = buildRequest({ useCookies: true })

import extractEvents from 'scrapers/usac-events/usac-events-scraper'
import buildEventUrls from 'scrapers/usac-events/build-urls'
import { writeJsonToFile } from 'file-utils'

// "rrfilter" is USAC specific URL param
// rr - results & runking
// F - fun events
// sr - state and regional Championships
// all - all events
async function scrapeUsacEvents({ year, state, rrfilter }) {
  const urls = buildEventUrls({
    year: year,
    rrfilter: rrfilter
  })
  log.info('Scraping ' + urls.length + ' urls...')

  const scrapeEvents = buildScraper({
    writeResultsToFile: true,
    fileName: `events/${year}/CN_all-types_noncomp-0_rrfilter-${rrfilter}`,
    scrapingFunc: extractEvents,
    delay: 500,
    concurrency: 5,
    request: request
  })

  log.task('Loading base url to get cookies')
  // parameters are not important as long as they are valid, making a request just to get cookies
  const response = await request(
    'https://legacy.usacycling.org/events/state_search.php?state=CN&race=Road&fyear=&rrfilter=rr'
  )
  log.done(response.request.uri.href)
  log.task('Scraping...')
  const events = await scrapeEvents({ fromUrls: urls })
  return events
}

async function main({ year }) {
  const allEvents = await scrapeUsacEvents({
    year: year,
    state: 'CN',
    rrfilter: 'all'
  })
  const funEvents = await scrapeUsacEvents({
    year: year,
    state: 'CN',
    rrfilter: 'F'
  })
  // const stateChampEvents = await scrapeUsacEvents({ year: 2017, state: 'CN', rrfilter: 'sr' })
  // const resultsAndRankingEvents = await scrapeUsacEvents({ year: 2017, state: 'CN', rrfilter: 'rr' })

  // merge all events and funEvents by permit id, favoring events from funEvents
  // because they would havae a proper type "fun", while "all events" will have less accurate one
  // (typically "results and ranking")
  const complementedEvents = RS.replaceBy(
    (a, b) => a.permit === b.permit,
    funEvents,
    allEvents
  )
  const filePath = `data/events/${year}/CN_all.json`
  await writeJsonToFile(filePath, complementedEvents)
  log.done(`Saved results to "${filePath}"`)
}

main({ year: 2017 }).catch(e => log.fail(e))

/* USAC clubs
    https://www.usacycling.org/clubs/clubsearch.php?club=14822
    as search https://www.usacycling.org/clubs/clubsearch.php?advanced=1
    https://www.usacycling.org/clubs/clubsearch.php?order=name&org=&st=CA&zipcode=&radius=25&club=

 Individual Events
  https://www.usacycling.org/events/?advanced=1
  https://www.usacycling.org/events/?state=CA&race=&fyear=2017&rrfilter=rr
*/

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
