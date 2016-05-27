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
  const error = $('.errormessage').text().trim()

  if (error) {
    if (error.toLowerCase() === 'No member found matching the license number .'.toLowerCase()) {
      log.doneBut('#' + urlWithContext.context.licenceNo + ' ' + error)
      return []
    } else {
      log.fail(error)
      log.json(urlWithContext)
    }
  }

  const $mainTable = $('#resultsmain table')
  let nameLbl = $mainTable.find('td b').eq(0).text()
  let ageAndFromLbl = $mainTable.find('td b').eq(1).text()
  let raceCount = $mainTable.find('tr.homearticlebody').toArray().length

  let name

  if (nameLbl) {
    name = nameLbl.match(/Race Results for(.+)/)[1].trim()
  }

  let age
  let address

  if (ageAndFromLbl) {
    let ageMatches = ageAndFromLbl.match(/Racing Age (\d\d?\d?) .*/)

    if (ageMatches && ageMatches.length > 0) {
      age = ageMatches[1]
    }

    let addressMatches = ageAndFromLbl.match(/from (.*)/)

    if (addressMatches && addressMatches.length > 0) {
      address = addressMatches[1].trim()
    }
  }

  const racerInfo = {
    licenceNo: urlWithContext.context.licenceNo,
    name: name,
    age: age,
    raceCount: raceCount,
    address: address,
    _urlUsedToPullInfo: urlWithContext.url,
  }
  // log.json(racerInfo)
  log.done(`#${urlWithContext.context.licenceNo} - ${name}, ${age}, ${address}, races: ${raceCount}`)

  return [racerInfo]
}

const buildScraperForLicenses = ({licenceNoFrom = 0, licenceNoTo = 0}) => {
  return buildScraper({
    fileName: `racers_lic-no-range_${licenceNoFrom}-${licenceNoTo}`,
    scrapingFunc: extractRacerInfo,
    delay: 500,
    concurrency: 5
  })
}

// const extractRacersFrom0to10 = buildScraperForLicenses({licenceNoFrom: 0, licenceNoTo: 10})

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

// const urls = buildRacerUrls({licenceNoFrom: 0, licenceNoTo: 10})
// const urls2 = buildRacerUrls({licenceNoFrom: 11, licenceNoTo: 20})
// const extractRacersFrom11to20 = buildScraperForLicenses({licenceNoFrom: 11, licenceNoTo: 20})

const scraperFrom0to9999 = buildScraperForLicenses({licenceNoFrom: 0, licenceNoTo: 9999})
const urls10000 = buildRacerUrls({licenceNoFrom: 0, licenceNoTo: 9999})

const scraperFrom10000to19999 = buildScraperForLicenses({licenceNoFrom: 10000, licenceNoTo: 19999})
const urls20000 = buildRacerUrls({licenceNoFrom: 10000, licenceNoTo: 19999})

const scraperFrom20000to29999 = buildScraperForLicenses({licenceNoFrom: 20000, licenceNoTo: 29999})
const urls30000 = buildRacerUrls({licenceNoFrom: 20000, licenceNoTo: 29999})

const scraperFrom30000to39999 = buildScraperForLicenses({licenceNoFrom: 30000, licenceNoTo: 39999})
const urls40000 = buildRacerUrls({licenceNoFrom: 30000, licenceNoTo: 39999})

const scraperFrom40000to49999 = buildScraperForLicenses({licenceNoFrom: 40000, licenceNoTo: 49999})
const urls50000 = buildRacerUrls({licenceNoFrom: 40000, licenceNoTo: 49999})

const scraperFrom50000to59999 = buildScraperForLicenses({licenceNoFrom: 50000, licenceNoTo: 59999})
const urls60000 = buildRacerUrls({licenceNoFrom: 50000, licenceNoTo: 59999})

scraperFrom0to9999(urls10000)
  .then(() => scraperFrom10000to19999(urls20000))
  .then(() => scraperFrom20000to29999(urls30000))
  .then(() => scraperFrom30000to39999(urls40000))
  .then(() => scraperFrom40000to49999(urls50000))
  .then(() => scraperFrom50000to59999(urls60000))
