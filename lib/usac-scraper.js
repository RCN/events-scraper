import log from './console-tools'
// import _ from 'lodash'
import S from 'string'
S.extendPrototype()
import buildScraper from 'scraper'

// import extractEvents from 'scrapers/usac-events-scraper'
// import buildEventUrls from 'scrapers/usac-events-url-builder'
// import request from 'request-utils'

// const urls = buildEventUrls()
// log.info('Crawling ' + urls.length + ' urls...')
//
// const extractEventsFrom = buildScraper({
//   fileName: 'all-years_all-states_all-types_noncomp-0_rrfilter-rr',
//   scrapingFunc: extractEvents,
//   delay: 500,
//   concurrency: 1
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


import cheerio from 'cheerio' // jQuery-like HTML manipulation

const extractRacerInfo = ({response, urlWithContext}) => {
  let $ = cheerio.load(response.body)
  let nameLbl = $('#resultsmain table td').eq(0).children()

  log.json(nameLbl)

  return ['nameLbl']
  //$('tbody>.homearticlebody')
}

const extractRacersFrom = buildScraper({
  fileName: 'racers_lic-no-range_1-10000',
  scrapingFunc: extractRacerInfo,
  delay: 500,
  concurrency: 5
})

const buildRacerUrls = ({licenceNoFrom = 0, licenceNoTo = 0}) => {
  const baseUrl = 'http://usacycling.org/results/?compid='
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

const urls = buildRacerUrls({licenceNoFrom: 0, licenceNoTo: 1})

extractRacersFrom(urls)
