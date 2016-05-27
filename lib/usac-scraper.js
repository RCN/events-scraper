import log from './console-tools'
import _ from 'lodash'
import S from 'string'
S.extendPrototype()

import Bluebird from 'bluebird'
import request from 'request'
import queryString from 'query-string'
import extractEvents from 'scrapers/usac-events-scraper'
import {writeJsonToFile, appendJsonToFile} from 'file-utils'
import moment from 'moment'
// used for unique file-names for caching results
const TIME_STAMP = moment().format('x_MMM-DD-YYYY_hh-mmA')
const fileName = 'fun-rides_all-years_all-states_all-types_noncomp-0'

const req = Bluebird.promisify(request.defaults({
  jar: true,
  agentOptions: {
      /*  since iojs 1.3 new TLS cipher defaults have been switched to more secure, e.g. RC4 family is not supported anymore, for web-scraping we still have
          to deal with some legacy web-sites that use insecure ciphers, so overriding defaults to enable RC4 and other back */
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:ECDHE-RSA-DES-CBC3-SHA:ECDHE-ECDSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:DES:RC4:MD5:PSK:aECDH:EDH-DSS-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:KRB5-DES-CBC3-SHA'
  }
}), {multiArgs: true})

// Bluebird.longStackTraces() //Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.

var eventsSearchUrl = {
  url: 'https://www.usacycling.org/events/state_search.php?',
  context: {
    year: null,
    state: null,
    discipline: null, // 'Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX'
    usacEventType: null, // "Results & Ranking" "Fun" "State/Regional Championships"
    noncomp: null, // 0 or 1
  }
}

// (initial urls, name of the url param,  array of values,
// contextParam is them of the parameter to attach to a supporting object) => list of urls

/*
  for every passed url creates a set of urls with all the values passed in, e.g. for 2 passed urls
  and 3 different values for the given urlParam it would output 2*3=6 urls.
*/
const buildUrlsFor = (urlsWithContext, {urlParam, contextParam, values}) => {
  return urlsWithContext
    .map(urlWithContext => values.map(
      value => {
        let newUrl = _.cloneDeep(urlWithContext)
        newUrl.url += queryString.stringify({[urlParam]: value}) + '&'

        if (contextParam) {
          newUrl.context[contextParam] = value
        }

        return newUrl
      }
    ))
    .reduce((a, b) => a.concat(b)) // flattening arrays
}

// const startingYear = 2005
// const disciplines = ['Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX']
// const eventTypes = ['rr', 'F', 'sr'] //rr - ranking, F - fun events, sr - state or regional champs

// event counts are split by low-med-high to optimize amount of requests we are making with ctn (paging) params
// ctn=40
const lowEventCountStates = ['AZ', 'NV', 'OR', 'WA', 'UT', 'ID', 'MT', 'WY', 'NM', 'OK', 'KS', 'NE',
  'SD', 'ND', 'MN', 'MO', 'AR', 'LA', 'MS', 'IL', 'WI', 'AL', 'GA', 'SC', 'KY', 'VA', 'WV',
  'OH', 'IN', 'MI', 'DC', 'MD', 'DE', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME', 'HI', 'AK'
]
// ctn=60
const mediumEventCountStates = ['CS', 'NJ', 'FL', 'CO', 'NC', 'IA', 'TX']
// ctn=100
const highEventCountStates = ['PA']
// ctn=120
const extraHightEventcountStates = ['CN']

// const allStates = lowEventCountStates
//   .concat(mediumEventCountStates)
//   .concat(highEventCountStates)
//   .concat(extraHightEventcountStates)

let baseUrls = buildUrlsFor([eventsSearchUrl], {urlParam: 'ajax', values: [2]})
let urlsWithYears = buildUrlsFor(baseUrls, {urlParam: 'fyear', contextParam: 'year', values: [2005, 2006, 2007, 2008, 2009, 2010, 2012, 2014, 2015, 2016]})

const buildUrlsForStatesWithCtn = (urls, states, ctn) => {
  const buildUrlsForRankingEvents = (urls) => {
    const disciplines = ['Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX']
    let newUrls = [].concat(urls)
    newUrls = buildUrlsFor(newUrls, {urlParam: 'race', contextParam: 'discipline', values: disciplines})
    newUrls = buildUrlsFor(newUrls, {urlParam: 'rrfilter', contextParam: 'usacEventType', values: ['F']})
    newUrls = buildUrlsFor(newUrls, {urlParam: 'noncomp', contextParam: 'noncomp', values: [0]})
    return newUrls
  }

  let urlsForStates = buildUrlsForRankingEvents(urls)
  urlsForStates = buildUrlsFor(urlsForStates, {urlParam: 'state', contextParam: 'state', values: states})
  urlsForStates = buildUrlsFor(urlsForStates, {urlParam: 'cnt', values: ctn})
  return urlsForStates
}

let urlsForLowEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, lowEventCountStates, [0, 20])
let urlsForMidEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, mediumEventCountStates, [0, 20])
let urlsForHighEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, highEventCountStates, [0, 20])
let urlsForExtraHighEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, extraHightEventcountStates, [0, 20])

let urls = urlsForLowEventCountStates
  .concat(urlsForMidEventCountStates)
  .concat(urlsForHighEventCountStates)
  .concat(urlsForExtraHighEventCountStates)

// // all urls for all states
// let urls = buildUrlsFor(urlsWithYears, {urlParam: 'state', contextParam: 'state', values: allStates})
// urls = buildUrlsFor(urls, {urlParam: 'race', contextParam: 'discipline', values: disciplines})
// urls = buildUrlsFor(urls, {urlParam: 'rrfilter', contextParam: 'usacEventType', values: ['rr']})
// urls = buildUrlsFor(urls, {urlParam: 'noncomp', contextParam: 'noncomp', values: [0]})
// urls = buildUrlsFor(urls, {urlParam: 'cnt', values: [0, 20, 40, 60, 80, 100, 120, 140]})

// for testing
// let urls = buildUrlsFor(baseUrls, {urlParam: 'fyear', contextParam: 'year', values: [2015, 2016]})
// urls = buildUrlsFor(urls, {urlParam: 'state', contextParam: 'state', values: ['CN']})
// urls = buildUrlsFor(urls, {urlParam: 'race', contextParam: 'discipline', values: ['Road', 'Mountain']})
// urls = buildUrlsFor(urls, {urlParam: 'rrfilter', contextParam: 'usacEventType', values: ['rr']})
// urls = buildUrlsFor(urls, {urlParam: 'noncomp', contextParam: 'noncomp', values: [0]})
// urls = buildUrlsFor(urls, {urlParam: 'cnt', values: [0, 20, 40]})

// log.json(urls.map(url => url.url))
log.info('Crawling ' + urls.length + ' urls...')

// run 3 concurrently with 1000ms delay in between
var extractEventsFrom = urlsWithContext =>
  Bluebird.map(
    urlsWithContext,
    urlWithContext => req(urlWithContext.url)
      .delay(500)
      .spread(response => extractEvents({
        response: response,
        urlWithContext: urlWithContext
      }))
      // after we got data from every url we can do something, e.g. write it to file
      .then(events => {
        if (events.length > 0) {
          const cacheFileName = `${TIME_STAMP}_${fileName}.json`
          return appendJsonToFile(`data/cache/${cacheFileName}`, events, {spaces: 2})
            .then(() => events)
        } else {
          return events
        }
      }),
    {concurrency: 5}
  )

log.task('Loading base url to get cookies')

// parameters are not important as long as they are valid, making a request just to get cookies
req(eventsSearchUrl.url + '?state=CN&race=Road&fyear=&rrfilter=rr')
  // using spread since it parses arguments list from array to plain ones
  .spread(response => log.done(response.request.uri.href))
  .then(() => {
    log.task('Crawling...')
    return extractEventsFrom(urls)
  })
  .reduce((events, currentEvents) => events.concat(currentEvents))
  .then(events => {
    log.info('Total events: '.grey + events.length.toString().white)
    return writeJsonToFile(`data/${fileName}.json`, events, {spaces: 2})
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

/*
 todo idea for generic implementation
 - promise/RxJs based solution that accepts
 - array of urls to load
 - (possibly) urls to get sequentially first,  to store cookies in the session or so
 - (optionally) number of queries to do in parallel
 - (possibly) some state for requests (to share cookies etc)
 - parsing function that returns single object or array
 - automatically map and reduce results from parsing function to one collection of objects or combined arrays
 - so module would abstract promise related task management, possible API:
    var results = scrape(urls, {parallel: 5}, parsingFunc)
    var events = req(url).thenScrape(eventUrls, extractEventInfo)
 todo problems with UsaCycling:
 - currently there are some duplicates of the events
 - need to be able to compare events on equality
 - simplest thing would be co compare by permit-id: but this needs to be confirmed that there are no different events
 under same permit

 */
