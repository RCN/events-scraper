// TODO: alternatively we can download all events from bikereg and do better and more advanced
  // search and matching locally
// TODO: make sure both EventUrl and EvnetPermalink are stored in RCN so we can do rolling reg links
// this means we would show
//TODO: if fetching by permit fails collect failed requests and try fetching by name
  // return result from scraping func with metadata and status like "not found" so we can do second
  // pass on it
  // alternatively this could be a good case to introduce smarter way to generate urls which is
  // a generator or a function that gets called every time during scraping and access to current
  // scraping state is provided to it so it can decide what to do next. This way we can build a
  // smart function that encapsulates decisions on how to build urls and what to request next
//TODO: CCCX returns multiple results for the same permit, need to handle that somehow

import { log } from 'console-tools'
import { get, partialRight, pipe, uniq, map, keyBy } from 'lodash/fp'
// import buildScraper from 'little-scraper'
import buildScraperWithProxy from 'scrapers/utils/scraper-with-proxy.js'
import usac2017Events from '../../../data/events/2017/CN_all-types_noncomp-0_rrfilter-rr.json'

const createUrlsWithPermits = ({ usacEvents, year }) => {
  // bikereg by default would only return future events, unless year parameter is provided
  const createUrl = permit =>
    `https://www.bikereg.com/api/search?permit=${permit}&year=${year}`

  const permits = pipe(
    map(x => x.permit),
    uniq,
    // take(20),
  )(usacEvents)

  return permits.map(permit => ({
    url: createUrl(permit),
    context: { permit: permit }
  }))
}

const createUrlsWithNames = ({ usacEvents, year }) => {
  // bikereg by default would only return future events, unless year parameter is provided
  const createUrl = name =>
    `https://www.bikereg.com/api/search?name=${encodeURIComponent(name)}&year=${year}`

  const names = pipe(
    map(x => x.name),
    uniq,
  )(usacEvents)

  return names.map(name => ({
    url: createUrl(name),
    context: { eventName: name }
  }))
}

const getEeventByPermit = ({ response, urlWithContext }) => {
  if (!response.body) {
    log.fail(`${urlWithContext.url} - no "response.body"`)
  }

  const createResponse = ({status}) => ({ status: status, context: urlWithContext.context })

  try {
    const responseJson = JSON.parse(response.body)
    const getResponseProp = partialRight(get, [responseJson])

    if (getResponseProp('ResultCount') > 1) {
      log.fail(
        `${urlWithContext.url} - returned ` +
          `${getResponseProp('ResultCount')} ` +
          `matching events, while expeced 1`
      )
      return [createResponse({status: 'Error'})]
    }

    if (getResponseProp('ResultCount') === 0) {
      log.warn(`${urlWithContext.url} - event not found`)
      return [createResponse({status: 'Not Found'})]
    }

    const event = getResponseProp('MatchingEvents[0]')

    log.done(`${urlWithContext.url}`)

    return [{
      data: {
        regUrl: event.EventUrl,
        permanentUrl: event.EventPermalink
      },
      ...createResponse({status: 'Success'})
    }]
  } catch (e) {
    log.fail(
      `${urlWithContext.url} - can not parse response body json, got this:`
    )
    log.json(response.body)
    log.error(e)
  }
}

const scrape = buildScraperWithProxy({
  scrapingFunc: getEeventByPermit,
  concurrency: 10,
  delay: 500
})

async function runScraping() {
  const results = await scrape(createUrlsWithPermits({ usacEvents: usac2017Events, year: 2017 }))

  // if we couldn't find event by permit try by name
  const notFoundEventPermits = results
    .filter(x => x.status === 'Not Found')
    .map(x => x.context.permit)
  const usacEventsMap = keyBy('permit', usac2017Events)
  const notFoundUsacEvents = notFoundEventPermits.map(permit => usacEventsMap[permit])
  const additionalResults = await scrape(createUrlsWithNames({
    usacEvents: notFoundUsacEvents, year: 2017
  }))

  // log.json(notFoundUsacEvents)
  // log.json(results, 3)
}

runScraping()

export default scrape
