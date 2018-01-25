/*

- categories http://ncnca.org/wp-json/wp/v2/tribe_events_cat/
 or http://ncnca.org/wp-json/tribe/events/v1/categories
- venues http://ncnca.org/wp-json/tribe/events/v1/venues?page=1&per_page=100
- organizers http://ncnca.org/wp-json/tribe/events/v1/organizers?page=1&per_page=100
- events
  http://ncnca.org/wp-json/tribe/events/v1/events?page=1&per_page=50&start_date=2010-01-01
    - max per_page is 50
    - returns number of pages in response
    - returns total events items in response


- explore it in swagger https://editor.swagger.io//?_ga=2.36160608.1988612952.1516738560-163100802.1516738560#/
 - File => Import URL => http://ncnca.org/wp-json/tribe/events/v1/doc
 */

import { log } from 'console-tools'
import buildScraper from 'scrapers/utils/scraper-with-proxy'
import { writeJsonToFile } from 'file-utils'
import queryString from 'query-string'
import R from 'ramda'

const API_BASE = 'http://ncnca.org/wp-json/tribe/events/v1'

const createEventUrl = ({ year, page }) => {
  const queryParams = queryString.stringify({
    page,
    per_page: 50, // it's the max
    // events should start after the specified date
    start_date: `${year}-01-01 00:00:00`,
    // events should start before the specified date
    end_date: `${year}-12-31 23:59:59`
  })
  const url = `${API_BASE}/events?${queryParams}`

  const urlWithContext = {
    url: url,
    context: { year, page }
  }

  return urlWithContext
}

const createPagedUrl = urlBase => page => ({
  url: `${urlBase}?${queryString.stringify({
    page,
    per_page: 50 // it's the max
  })}`,
  context: { page }
})

function* generatePagedUrlsUsing(createPagedUrl) {
  let page = 0

  while (true) {
    page += 1
    yield createPagedUrl(page)
  }
}

function* generateEventUrls({ year }) {
  let page = 0

  while (true) {
    page += 1
    yield createEventUrl({ year, page })
  }
}

const buildScraperFor = ({ entityName, concurrency = 1 }) =>
  buildScraper({
    scrapingFunc: ({ response, urlWithContext }) => {
      const results = JSON.parse(response.body)
      return R.propOr([], entityName, results)
    },
    scrapeWhile: ({ response, urlWithContext }) => {
      return response.statusCode !== 404
    },
    delay: 500,
    concurrency: concurrency,
    successStatusCodes: [200, 404],
    logProgress: true
  })

//TODO: after scraping events for a given year => use another scraper that would use
//TODO: urls pulled from these results => fetch every web page and try to parse meta "Other"
//TODO: section like this one http://ncnca.org/event/otf-stage-race-hensley-lake-road-race/
//TODO: to pull RegLink and PERMIT ID, thenn augment previously pulled events with that information
//TODO: and then save
async function scrapeNcncaEventsViaApi({ year }) {
  const scrapeEvents = buildScraperFor({ entityName: 'events', concurrency: 3 })

  const results = await scrapeEvents({
    fromUrlsIterator: generateEventUrls({ year })
  })

  console.info('Total events: ', results.data.length)

  const savedFilePath = await writeJsonToFile(
    `data/ncnca/events/${year}.json`,
    results.data
  )

  log.task('File saved successfully: ' + savedFilePath)

  return results
}

async function scrapeNcncaEntity({ entityName }) {
  const scrapeEvents = buildScraperFor({ entityName })
  const createEntityUrl = createPagedUrl(`${API_BASE}/${entityName}`)

  const results = await scrapeEvents({
    fromUrlsIterator: generatePagedUrlsUsing(createEntityUrl)
  })

  const savedFilePath = await writeJsonToFile(
    `data/ncnca/${entityName}/index.json`,
    results.data
  )

  log.task('File saved successfully: ' + savedFilePath)
  console.info(`Total ${entityName}: `, results.data.length)

  return results
}

async function main() {
  try {
    // const { data } = await scrapeNcncaEventsViaApi({ year: 2017 })
    await scrapeNcncaEventsViaApi({ year: 2018 })
    await scrapeNcncaEntity({ entityName: 'venues' })
    await scrapeNcncaEntity({ entityName: 'organizers' })
    await scrapeNcncaEntity({ entityName: 'categories' })
  } catch (err) {
    log.fail(err)
  }
}

main()
