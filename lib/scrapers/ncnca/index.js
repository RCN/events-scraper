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

import buildScraper from 'scrapers/utils/scraper-with-proxy'
import { writeJsonToFile } from 'file-utils'
import queryString from 'query-string'

const createEventUrl = ({ year, page }) => {
  const queryParams = queryString.stringify({
    page,
    per_page: 50, // it's the max
    start_date: `${year}-01-01 00:00:00`,
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

const iterator = generateEventUrls({ year: 2017 })
