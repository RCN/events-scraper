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

import P from 'bluebird'
import { log } from 'console-tools'
import R from 'ramda'
// import buildScraper from 'little-scraper'
import buildScraper from 'scrapers/utils/scraper-with-proxy'
import queryString from 'query-string'
import { states } from './states'
import { writeJsonToFile } from 'file-utils'
import { DateTime } from 'luxon'

const EVENT_TYPES = ['ROAD', 'MTN', 'TRACK', 'CX', 'BMX']

console.info('starting...')

const sortByPermit = R.pipe(
  R.sortWith([
    // first sort by year
    R.ascend(x => parseInt(x.event_year, 10)),
    // then sort by event_id, which is xxx part in "2018-xxx" permit
    R.ascend(x => parseInt(x.event_id, 10))
  ])
)

// const sortByStartDate = R.sortWith([R.ascend(x => DateTime.fromISO(x.date_start))])

const throwError = msg => {
  throw new Error(msg)
}

const oneOf = valuesToCheck => value =>
  R.contains(value, valuesToCheck)
    ? value
    : throwError(`"${value}" is not one of "${valuesToCheck}"`)

const getValidEventTypeParam = oneOf(EVENT_TYPES)
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
      // log.debug('Total events: ' + eventJson.length)
      return eventJson
    },
    scrapeWhile: ({ response, urlWithContext }) => {
      const eventJson = JSON.parse(response.body)
      return !R.isEmpty(eventJson)
    },
    delay: 500,
    concurrency: 1,
    logProgress: true,
    logHttp: true
    // writeResultsToFile: true,
    // fileName: `events/via-api/${year}/${state}-${type}`
    // request: request
  })

  const results = await scrapeEvents({
    fromUrlsIterator: generateEventUrls({ year, type, state })
  })
  log.json('Total events: ' + results.data.length)
  return results
}

async function main() {
  // await scrapeUsacEventsViaApi({ year: 2017, type: 'ALL', state: 'MT' })
  const year = 2017
  const state = 'CA'
  const type = 'ALL'
  try {
    // const { data } = await scrapeUsacEventsViaApi({ year, type, state })
    const results = await P.map(
      ['ALL'].map(eventType => ({
        type: eventType,
        year,
        state
      })),
      params => scrapeUsacEventsViaApi(params),
      { concurrency: 3 }
    ).reduce((acc, { data }) => acc.concat(data), [])

    const sortedResults = sortByPermit(results)

    // TODO: sort by permit, and compare with "ALL", superset of all events by type should be
    // same as a set of events using ALL
    // TODO: do this for multiple states/years to make sure
    await writeJsonToFile(
      `events/via-api/${year}/${state}-${type}.json`,
      sortedResults
    )
  } catch (err) {
    console.error(err)
  }
}

main()
