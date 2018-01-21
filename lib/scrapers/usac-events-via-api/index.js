// urls parameters
/*
  page_start=0|20|40 and up to empty, have to use a generator
  starts_from=2000-01-01
    it sounds like first one is 2005-76
  starts_to=2017-12-29
  type=ROAD|MTN|TRACK|CX|BMX (event JSON doesn't have event discipline)

  directory structure for now
    2017/
      all.json

      // later split by states (we don't have NCA and SCA split now)
      NCA/
      CA/
      NY/
 */

import { log } from 'console-tools'
import R from 'ramda'
// import buildScraper from 'little-scraper'
import buildScraper from 'scrapers/utils/scraper-with-proxy'
import queryString from 'query-string'
import { states } from './states'

console.info('starting...')

const throwError = msg => {
  throw new Error(msg)
}

const oneOf = valuesToCheck => value =>
  R.contains(value, valuesToCheck)
    ? value
    : throwError(`"${value}" is not one of "${valuesToCheck}"`)

const getValidEventTypeParam = oneOf(['ROAD', 'MTN', 'TRACK', 'CX', 'BMX'])
const getValidState = oneOf(R.keys(states))

const createEventUrl = ({ year, type, state, pageStart }) => {
  const queryParams = queryString.stringify({
    starts_from: `${year}-01-01`,
    starts_to: `${year}-12-31`,
    type: type === 'ALL' ? undefined : getValidEventTypeParam(type),
    page_start: pageStart,
    state: getValidState(state)
  })
  const url = `https://www.usacycling.org/API/events/?${queryParams}`

  const urlWithContext = {
    url: url,
    context: { year, type, state, pageStart }
  }

  return urlWithContext
}

function* generateEventUrls({ year, type, state }) {
  // max size as of now
  const PAGE_SIZE = 20
  let pageStart = 0

  while (true) {
    yield createEventUrl({ year, type, state, pageStart })
    pageStart += PAGE_SIZE
  }
}

async function scrapeUsacEventsViaApi({ year, type, state }) {
  const scrapeEvents = buildScraper({
    // writeResultsToFile: true,
    // fileName: `events/via-api/${year}/CN_all-types_noncomp-0_rrfilter-${rrfilter}`,
    scrapingFunc: ({ response, urlWithContext }) => {
      const eventJson = JSON.parse(response.body)
      log.debug('Total events: ' + eventJson.length)
      return eventJson
    },
    scrapeWhile: ({ response, urlWithContext }) => {
      const eventJson = JSON.parse(response.body)
      return !R.isEmpty(eventJson)
    },
    delay: 500,
    concurrency: 3,
    logProgress: true,
    logHttp: true,
    writeResultsToFile: true,
    fileName: `events/via-api/${year}/${state}-${type}`
    // request: request
  })

  const results = await scrapeEvents({
    fromUrlsIterator: generateEventUrls({ year, type, state })
  })
  log.json(results.data.length)
}

async function main() {
  // await scrapeUsacEventsViaApi({ year: 2017, type: 'ALL', state: 'MT' })
  await scrapeUsacEventsViaApi({ year: 2017, type: 'ALL', state: 'CA' })
}

main()
