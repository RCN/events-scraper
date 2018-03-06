/* scrapes additional event information using web link, unfortunately as of today there is
no good way to get "meta" fields, since Calendar plugin that NCNCA uses on wordpress blog does
not support meta fields in their REST API */

import { log } from 'console-tools'
import buildScraper from 'scrapers/utils/scraper-with-proxy'
import R from 'ramda'

import cheerio from 'cheerio' // jQuery-like HTML manipulation

const createEventUrls = events =>
  events.map(x => ({
    url: x.url,
    context: { url: x.url, id: x.id }
  }))

export async function scrapeNcncaEventsViaWebLinksFrom(events) {
  const scrapeEvents = buildScraper({
    scrapingFunc: ({ response, urlWithContext }) => {
      const $ = cheerio.load(response.body)
      // try find "Other" secion on the page, which is tribe-meta section
      const $metaValues = $('.tribe-events-meta-group-other .tribe-meta-value')
      const getMetaValue = id =>
        $metaValues
          .eq(id)
          .text()
          .trim()

      const urls = [getMetaValue(0), getMetaValue(1), getMetaValue(2)].filter(
        R.identity
      )

      // filter url that doesn't contain results or flyer
      const registrationUrl = R.pipe(
        R.filter(url => !url.includes('results') & !url.includes('flyer')),
        R.head
      )(urls)
      // results url always contains this part
      const resultsUrl = R.find(url => url.includes('/results'), urls)
      // flyer url always contains this part
      const flyerUrl = R.find(url => url.includes('/getflyer'), urls)

      const permit = flyerUrl
        ? R.prop(1, flyerUrl.match(/permit=(\d{4}-\d+)/))
        : undefined

      return [
        {
          registrationUrl,
          resultsUrl,
          flyerUrl,
          permit,
          originalEventId: urlWithContext.context.id
        }
      ]
    },
    delay: 500,
    concurrency: 5,
    successStatusCodes: [200],
    logProgress: true
  })

  const results = await scrapeEvents({
    fromUrls: createEventUrls(events)
  })

  log.task(`Scraped ${results.data.length} events from their web links.`)

  return results
}
