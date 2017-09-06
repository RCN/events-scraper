/** list of results by state https://www.usacycling.org/results/browse.php?state=CN&race=&fyear=2017
  Few approaches:
    - scrape links to results from those pages by year by sate
      - then download results
    - or try iterating ids
    - or (preferrred approach)
      - scrape events
      - have a list of permits
      - doenload results using the list of valid permit ids
If any cookie is present then the following direct link can be used:
  vanilla CSV:
    https://www.usacycling.org/results/index.php?year=2011&id=3524&ajax=1&act=csv
  formatted CSV:
    https://www.usacycling.org/results/index.php?year=2011&id=3524&ajax=1&act=resultscsv

  Note that id is permit number, the second part .e.g permit 2013-3042 (giro di sf) is this URL:
    https://www.usacycling.org/results/index.php?year=2013&id=3042&ajax=1&act=resultscsv
    so as long as we have a list of permits we can download all event results basically just by iterating through ids

  Note that for non-existent event it would still download results file


  Unfortunately we would probably need to download both CSVs since one has racer's City/State and another
  one doesn't. Or maybe we can use racer database we scraped before, but it's less accurate since
  state could change from the momemnt we pulled it.

  About 2000-3000 events a year x 2csv x 10-12 years = ~40000-7200 requests

  50000 requests with concurrency of 3 with 1s interval is 166000 seconds / 3600 = ~4-5 hours
**/
import readCsvAsJson from '../utils/read-csv-as-json'
import { countBy } from '../../../data-tools/utils/analytics'

// async function readAndParse() {
//   const results = await readCsvAsJson('./lib/scrapers/usac-results/data-examples/results-2013-3042.csv')
//   log.json(results[0])
//   log.json(countBy('Race Discipline', results))
// }
//
// readAndParse()
// .then(console.info)

import { log } from 'console-tools'
import buildScraperWithProxy from 'scrapers/utils/scraper-with-proxy.js'
// import buildScraper from 'little-scraper'
import f from 'lodash/fp'
import buildRequest from 'build-request'
const request = buildRequest({ useCookies: true })
import writeTextToFile from '../../../data-tools/utils/write-text-to-file'
import P from 'bluebird'

const createResultUrls = ({ year, csvType }) => {
  // type could be 'csv' (formatted csv) or 'resultscsv' (plain csv)
  const type =
    csvType === 'plain'
      ? 'resultscsv'
      : csvType === 'formatted'
        ? 'csv'
        : log.fail('need csv type')

  const createUrl = (type, permitSecondPart) =>
    `https://www.usacycling.org/results/index.php?year=${year}&id=${permitSecondPart}&ajax=1&act=${type}`

  return f.range(1, 3200).map(number => ({
    url: createUrl(type, number),
    context: { permit: `${year}-${number}` }
  }))
}
//
const downloadResultsCsv = ({ response, urlWithContext }) => {
  const csv = response.body

  // empty results (somewhat)
  if (csv.length < 130) {
    log.doneBut(`[empty] ${urlWithContext.url}`)
    return []
  }

  log.done(`[${csv.length} bytes] ${urlWithContext.url}`)

  return [
    {
      csv: csv,
      permit: urlWithContext.context.permit
    }
  ]
}

const scrape = buildScraperWithProxy({
  scrapingFunc: downloadResultsCsv,
  concurrency: 5,
  delay: 1000,
  request: request // for shared cookies
})

async function scrapeResults({ year }) {
  log.task('Loading base url to get cookies')
  // parameters are not important as long as they are valid, making a request just to get cookies
  const response = await request(
    'https://www.usacycling.org/events/state_search.php?state=CN&race=Road&fyear=&rrfilter=rr'
  )
  log.done(response.request.uri.href)
  const results = await scrape(
    createResultUrls({ year: year, csvType: 'plain' })
  )

  await P.map(
    results,
    result =>
      writeTextToFile(
        `./data/results/permit-${result.permit}_${'plain'}.csv`,
        result.csv
      ),
    { concurrency: 30 }
  )

  log.done(`Finished for ${year}`)
  log.json(results.length)
}

// todo run fetch of formatted events with now known permit ids (from file names)
async function main() {
  await scrapeResults({ year: 2006 })
  await scrapeResults({ year: 2007 })
  await scrapeResults({ year: 2008 })
}

main()
