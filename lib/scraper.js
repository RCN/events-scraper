import _ from 'lodash'
import moment from 'moment'
import Bluebird from 'bluebird'
import request from 'request-utils'
import {appendJsonToFile, writeJsonToFile} from 'file-utils'
import log from './console-tools'
// Bluebird.longStackTraces() //Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.

const TIME_STAMP = moment().format('x_MMM-DD-YYYY_hh-mmA')

// scrapingFunc accept an object with respnse and array of objects representing urls to scrape with
// whatever useful context you can think of crated while building them and returns array with scraped results
// event if it's one thing it must be an array, [ 'one thing' ]

// returns a function ready to be run to star scraping and writing results into cache
const buildScraper = ({
  fileName = 'tmp',
  scrapingFunc = (() => []),
  delay = 5000,
  concurrency = 1}
) => {
  return urlsWithContext =>
    Bluebird.map(
      urlsWithContext,
      urlWithContext => request(urlWithContext.url)
        .delay(delay)
        .spread(response => scrapingFunc({
          response: response,
          urlWithContext: urlWithContext
        }))
        // after we got data from every url we can do something, e.g. append it to file as intermediate result
        .then(events => {
          if (events.length > 0) {
            const cacheFileName = `${TIME_STAMP}_${fileName}.json`
            return appendJsonToFile(`data/cache/${cacheFileName}`, events, {spaces: 2})
              .then(() => events)
          } else {
            return events
          }
        }),
      {concurrency: concurrency}
    )
    // combining results into one array
    .reduce((results, currentResults) => results.concat(currentResults))
    // write results into file all at once
    .then(results => {
      log.info('Total results: '.grey + results.length.toString().white)
      return writeJsonToFile(`data/${fileName}.json`, results, {spaces: 2})
        .then(fileName => log.done(`Saved events to "data/${fileName}"`))
    })
    .catch(err => {
      if (err.stack) {
        var newStack = _.map(err.stack.lines(), (line, index) => {
          var newLine = line.trim()
          newLine = '\t\t' + newLine
          return newLine
        })
        .join('\n')

        log.fail(err.name + ', stack:\n ' + newStack)
      } else {
        log.fail('Something went wrong')
        log.debug(err)
      }
    })
}

export default buildScraper
