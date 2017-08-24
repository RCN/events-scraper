import { log } from 'console-tools'
import buildScraper from 'little-scraper'

const createUrls = () => {
  const createUrl = permit => `https://www.bikereg.com/api/search?permit=${permit}`

  return (['2017-2344']
    .map((permit) => ({
      url: createUrl(permit),
      context: {permit: permit}
    }))
  )
}

const getEeventByPermit = ({response, urlWithContext}) => {
  log.debug(response)
  return response
}

const scrape = buildScraper({
  scrapingFunc: getEeventByPermit,
  concurrency: 1,
  delay: 500,
})

async function runScraping() {
  const results = await scrape(createUrls())
  log.json(results)
}

runScraping()

export default scrape
