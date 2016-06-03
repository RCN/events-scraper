import log from './console-tools'
// import _ from 'lodash'
import S from 'string'
S.extendPrototype()
import buildScraper from 'scraper'
import buildRequest from 'request-utils'
// const request = buildRequest({useCookies: true})

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

  const noResultsMsg = $('#resultsmain').text().trim()

  if (noResultsMsg && noResultsMsg.toLowerCase() === 'No rider results found.'.toLowerCase()) {
    log.doneBut('#' + urlWithContext.context.licenceNo + ' ' + noResultsMsg)
    return []
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

  if (!name && !age && !address && !raceCount) {
    log.fail('#' + urlWithContext.context.licenceNo + ' ' + 'All fields are empty, something is wrong.')
    return []
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

const buildRacerUrls = ({licenceNoFrom = 0, licenceNoTo = 0}) => {
  const baseUrl = 'https://usacycling.org/results/?compid='
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
  concurrency = 1,
  cacheResultsToFile = true
}) => {
  return buildScraper({
    fileName: `racers_lic-no-range_${licenceNoFrom}-${licenceNoTo}`,
    scrapingFunc: extractRacerInfo,
    delay: delay,
    concurrency: concurrency,
    cacheResultsToFile: cacheResultsToFile
  })
}

const crawlNStartingFrom = ({startingLicNo, amountToCrawl, delay, concurrency}) => {
  const urls = buildRacerUrls({licenceNoFrom: startingLicNo, licenceNoTo: startingLicNo + amountToCrawl - 1})
  const scrapeRacers = buildScraperForLicenses({
    licenceNoFrom: startingLicNo,
    licenceNoTo: startingLicNo + amountToCrawl - 1,
    delay: delay,
    concurrency: concurrency,
    cacheResultsToFile: false
  })
  return scrapeRacers(urls)
}

// request('https://www.usacycling.org/events/state_search.php?state=CN&race=Road&fyear=&rrfilter=rr')
//   // using spread since it parses arguments list from array to plain ones
//   .spread(response => log.done(response.request.uri.href))
//   .then(() => {
//     log.task('Crawling...')
//     return crawlNStartingFrom({startingLicNo: 0, amountToCrawl: 1000, delay: 1000, concurrency: 3})
//   })

crawlNStartingFrom({startingLicNo: 285000,
  amountToCrawl: 15000, delay: 250, concurrency: 10})

// TODO: if nothing helps, use rotating IP proxies
/*
  http://proxymesh.com/ $20 month, 20 ips a day
  http://shader.io/ more ips (pool of 100)
*/
