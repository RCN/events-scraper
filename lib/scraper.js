import _ from 'lodash'
import moment from 'moment'
import Bluebird from 'bluebird'
import buildRequest from 'request-utils'
const request = buildRequest({useCookies: false})

import {appendJsonToFile, writeJsonToFile} from 'file-utils'
import log from './console-tools'
// Bluebird.longStackTraces() //Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.

const TIME_STAMP = moment().format('x_MMM-DD-YYYY_hh-mmA')

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// scrapingFunc accept an object with respnse and array of objects representing urls to scrape with
// whatever useful context you can think of crated while building them and returns array with scraped results
// event if it's one thing it must be an array, [ 'one thing' ]

const requestWithRotatingUserAgent = (url) => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36',
    // 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', //google bot
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0',
    'Mozilla/5.0 (X11; OpenBSD amd64; rv:28.0) Gecko/20100101 Firefox/28.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 7.0; InfoPath.3; .NET CLR 3.1.40767; Trident/6.0; en-IN)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A',
  ]
  const options = {
    url: url,
    headers: {
      'User-Agent': userAgents[rnd(0, userAgents.length - 1)]
    }
  }

  return request(url, options)
}

const retry = (funcToRetry, {max = 10, backoff = 100, context}) => {
  return new Bluebird.Promise((resolve, reject) => {
    const attempt = (attemptNo) => {
      if (attemptNo > 1) {
        log.warn(`#${context.context.licenceNo} - retrying, attempt ${attemptNo}/${max}`)
      }

      funcToRetry(attemptNo)
        .then(resolve)
        .catch((err) => {
          if (attemptNo >= max) {
            log.fail(`${context.url} Failed after ${max} attempts :(`)
            return reject(err)
          }
          setTimeout(() => attempt(attemptNo + 1), backoff)
        })
    }
    attempt(1)
  })
}

// returns a function ready to be run to star scraping and writing results into cache
const buildScraper = ({
  fileName = 'tmp',
  scrapingFunc = (() => []),
  delay = 5000,
  randomizeDelay = true,
  concurrency = 1,
  cacheResultsToFile = true,
}) => {
  return urlsWithContext =>
    Bluebird.map(
      urlsWithContext,
      urlWithContext =>
        retry(() => requestWithRotatingUserAgent(urlWithContext.url), {
          max: 20, backoff: 200, context: urlWithContext})
        .delay(randomizeDelay ? rnd(delay / 2, delay * 2) : delay)
        .spread(response => {
          // console.log(response.headers)
          return scrapingFunc({
            response: response,
            urlWithContext: urlWithContext
          })
        })
        // after we got data from every url we can do something, e.g. append it to file as intermediate result
        .then(events => {
          if (cacheResultsToFile && events.length > 0) {
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
