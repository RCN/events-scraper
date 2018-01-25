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

const createEventUrl = ({ year, page }) => {
  const queryParams = queryString.stringify({
    page,
    per_page: 50, // it's the max
    // events should start after the specified date
    start_date: `${year}-01-01 00:00:00`,
    // events should start before the specified date
    end_date: `${year}-12-31 23:59:59`
  })
  const url = `http://ncnca.org/wp-json/tribe/events/v1/events?${queryParams}`

  const urlWithContext = {
    url: url,
    context: { year, page }
  }

  return urlWithContext
}

function* generateEventUrls({ year }) {
  let page = 0

  while (true) {
    page += 1
    yield createEventUrl({ year, page })
  }
}

async function scrapeNcncaEventsViaApi({ year }) {
  const scrapeEvents = buildScraper({
    scrapingFunc: ({ response, urlWithContext }) => {
      const results = JSON.parse(response.body)
      return R.propOr([], 'events', results)
    },
    scrapeWhile: ({ response, urlWithContext }) => {
      return response.statusCode !== 404
    },
    delay: 500,
    concurrency: 3,
    successStatusCodes: [200, 404],
    logProgress: true
  })

  const results = await scrapeEvents({
    fromUrlsIterator: generateEventUrls({ year })
  })

  const savedFilePath = await writeJsonToFile(
    `data/ncnca/events/${year}.json`,
    results.data
  )

  log.done('File saved successfully: ' + savedFilePath)

  return results
}

async function main() {
  try {
    // const { data } = await scrapeNcncaEventsViaApi({ year: 2017 })
    const { data } = await scrapeNcncaEventsViaApi({ year: 2018 })
    console.dir(data.map(x => x.id).sort(), { colors: true, depth: 4 })
  } catch (err) {
    log.fail(err)
  }
}

main()
