// import _ from 'lodash'
// import S from 'string'
// S.extendPrototype()
import buildScraperWithProxy from 'scrapers/utils/scraper-with-proxy.js'
// import buildRequest from 'build-request'
// const request = buildRequest({useCookies: true})

// import extractEvents from 'scrapers/usac-events-scraper'
// import buildEventUrls from 'scrapers/usac-events-url-builder'
// import request from 'request-utils'

// const urls = buildEventUrls()
// log.info('Crawling ' + urls.length + ' urls...')
//
// const extractEventsFrom = buildScraper({
//   writeResultsToFile: true,
//   fileName: 'all-years_all-states_all-types_noncomp-0_rrfilter-rr',
//   scrapingFunc: extractEvents,
//   delay: 500,
//   concurrency: 1
//   cacheIntermediateResultsToFile: true,
// })
//
// log.task('Loading base url to get cookies')
// // parameters are not important as long as they are valid, making a request just to get cookies
// request('https://www.usacycling.org/events/state_search.php?state=CN&race=Road&fyear=&rrfilter=rr')
//   // using spread since it parses arguments list from array to plain ones
//   .spread(response => log.done(response.request.uri.href))
//   .then(() => {
//     log.task('Crawling...')
//     return extractEventsFrom(urls)
//   })

import scrapeRacerInfo from './scrape-racer-info'

const buildRacerUrls = ({ licenceNoFrom = 0, licenceNoTo = 0 }) => {
  const baseUrl = 'https://www.usacycling.org/results/?compid='
  // const baseUrl = 'http://google.com/?'
  let urls = []

  for (let i = licenceNoFrom; i <= licenceNoTo; i++) {
    let url = {
      url: baseUrl + i,
      context: {
        licenceNo: i
      }
    }
    urls.push(url)
  }

  return urls
}

const buildScraperForLicenses = ({
  licenceNoFrom = 0,
  licenceNoTo = 0,
  delay = 1000,
  concurrency = 1
}) =>
  buildScraperWithProxy({
    writeResultsToFile: true,
    fileName: `racers/racers_lic-no-range_${licenceNoFrom}-${licenceNoTo}`,
    scrapingFunc: scrapeRacerInfo,
    delay: delay,
    concurrency: concurrency
  })

const crawlNStartingFrom = ({
  startingLicNo,
  amountToCrawl,
  delay,
  concurrency
}) => {
  const urls = buildRacerUrls({
    licenceNoFrom: startingLicNo,
    licenceNoTo: startingLicNo + amountToCrawl - 1
  })
  const scrapeRacers = buildScraperForLicenses({
    licenceNoFrom: startingLicNo,
    licenceNoTo: startingLicNo + amountToCrawl - 1,
    delay: delay,
    concurrency: concurrency,
    cacheIntermediateResultsToFile: false
  })
  return scrapeRacers({ fromUrls: urls })
}

// request('https://www.usacycling.org/events/state_search.php?state=CN&race=Road&fyear=&rrfilter=rr')
//   // using spread since it parses arguments list from array to plain ones
//   .spread(response => log.done(response.request.uri.href))
//   .then(() => {
//     log.task('Crawling...')
//     return crawlNStartingFrom({startingLicNo: 0, amountToCrawl: 1000, delay: 1000, concurrency: 3})
//   })

const lastActiveLicence = 539932

crawlNStartingFrom({
  startingLicNo: lastActiveLicence + 1,
  amountToCrawl: 100,
  delay: 250,
  concurrency: 10
})
