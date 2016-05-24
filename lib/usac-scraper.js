import log from './console-tools'
import _ from 'lodash'
import S from 'string'
S.extendPrototype()

import Bluebird from 'bluebird'
import request from 'request'
const req = Bluebird.promisify(request.defaults({
  jar: true,
  agentOptions: {
      /*  since iojs 1.3 new TLS cipher defaults have been switched to more secure, e.g. RC4 family is not supported anymore, for web-scraping we still have
          to deal with some legacy web-sites that use insecure ciphers, so overriding defaults to enable RC4 and other back */
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:ECDHE-RSA-DES-CBC3-SHA:ECDHE-ECDSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:DES:RC4:MD5:PSK:aECDH:EDH-DSS-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:KRB5-DES-CBC3-SHA'
  }
}), {multiArgs: true})

// Bluebird.longStackTraces() //Long stack traces imply a substantial performance penalty, around 4-5x for throughput and 0.5x for latency.

import queryString from 'query-string'
import extractEvents from 'scrapers/usac-events-scraper'

// const startingYear = 2005
// const raceTypes = ['Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX']
// const eventTypes = ['rr', 'F', 'sr']
// const cnt = [0, 20, 40, 60, 80, 100, 120, 140]

var urlParams = {
  fyear: 2016,
  state: 'CN',
  race: 'Road',
  // race: '', //all event types
  noncomp: 0,
  // rrfilter: 'rr', //ranking events
  rrfilter: '',
  ajax: 2
}

var eventsSearchUrl = 'https://www.usacycling.org/events/state_search.php'
var parameterizedUrl = eventsSearchUrl + '?' + queryString.stringify(urlParams)

let urls = [
  parameterizedUrl + '&cnt=0', // cnt param used for paging, means "start from event which number equals to 0"
  parameterizedUrl + '&cnt=20',
  parameterizedUrl + '&cnt=40',
  parameterizedUrl + '&cnt=60',
  parameterizedUrl + '&cnt=80',
  parameterizedUrl + '&cnt=100',
  parameterizedUrl + '&cnt=120',
  parameterizedUrl + '&cnt=140'
    // parameterizedUrl + '&cnt=160'
]

var extractEventsFrom = urls =>
  Bluebird.map(urls,
    url => req(url)
      .spread(response => extractEvents({
        response: response,
        context: {
          urlParams: urlParams,
          url: url
        }
      })
    )
  )

log.task('Loading base url to get cookies')

// parameters are not important as long as they are valid, making a request just to get cookies
req(eventsSearchUrl + '?state=CN&race=Road&fyear=&rrfilter=rr')
  // using spread since it parses arguments list from array to plain ones
  .spread(response => log.done(response.request.uri.href))
  .then(() => {
    log.task('Loading events for year ' + urlParams.fyear.toString().italic)
    return extractEventsFrom(urls)
  })
  .reduce((events, currentEvents) => events.concat(currentEvents))
  .then(events => log.info('Total events: '.grey + events.length.toString().white))
  .catch(err => {
    if (err.stack) {
      var newStack = _.map(err.stack.lines(), function (line, index) {
        var newLine = line.trim()
        newLine = '\t\t' + newLine
        return newLine
      })
        .join('\n')

      log.fail(err.name +
        ', stack:\n ' + newStack)
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
