import log from './console-tools'
import _ from 'lodash'
import S from 'string'
S.extendPrototype()

import jsonfile from 'jsonfile'

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
const disciplines = ['Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX']
// const eventTypes = ['rr', 'F', 'sr'] //rr - ranking, F - fun events, sr - state or regional champs
// const cnt = [0, 20, 40, 60, 80, 100, 120, 140]
const states = ['CN', 'CS', 'AZ', 'NV', 'OR', 'WA', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM', 'TX', 'OK', 'KS', 'NE',
  'SD', 'ND', 'MN', 'IA', 'MO', 'AR', 'LA', 'MS', 'IL', 'WI', 'AL', 'GA', 'FL', 'SC', 'NC', 'KY', 'VA', 'WV',
  'OH', 'IN', 'MI', 'DC', 'MD', 'DE', 'PA', 'NJ', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME', 'HI', 'AK'
]

var urlParams = {
  fyear: 2016,
  state: 'CN',
  race: 'Road', // ['Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX']
  // race: '', //all event types
  noncomp: 0,
  // rrfilter: 'rr', //ranking events
  rrfilter: '',
  ajax: 2
}

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

let urls = buildUrlsFor([eventsSearchUrl], {urlParam: 'ajax', values: [2]})

urls = buildUrlsFor(urls, {urlParam: 'fyear', contextParam: 'year', values: [2005, 2006, 2007, 2008, 2009, 2010, 2012, 2014, 2015, 2016]})
urls = buildUrlsFor(urls, {urlParam: 'state', contextParam: 'state', values: states})
urls = buildUrlsFor(urls, {urlParam: 'race', contextParam: 'discipline', values: disciplines})
urls = buildUrlsFor(urls, {urlParam: 'rrfilter', contextParam: 'usacEventType', values: ['rr']})
urls = buildUrlsFor(urls, {urlParam: 'noncomp', contextParam: 'noncomp', values: [0]})
urls = buildUrlsFor(urls, {urlParam: 'cnt', values: [0, 20, 40, 60, 80, 100, 120, 140]})

// urls = buildUrlsFor(urls, {urlParam: 'fyear', contextParam: 'year', values: [2016]})
// urls = buildUrlsFor(urls, {urlParam: 'state', contextParam: 'state', values: ['CN']})
// urls = buildUrlsFor(urls, {urlParam: 'race', contextParam: 'discipline', values: ['Road', 'MTB']})
// urls = buildUrlsFor(urls, {urlParam: 'rrfilter', contextParam: 'usacEventType', values: ['rr']})
// urls = buildUrlsFor(urls, {urlParam: 'noncomp', contextParam: 'noncomp', values: [0]})
// urls = buildUrlsFor(urls, {urlParam: 'cnt', values: [0, 20, 40]})

// log.json(urls)
log.info('Crawling ' + urls.length + ' urls...')

// run 3 concurrently with 1000ms delay in between
var extractEventsFrom = urlsWithContext =>
  Bluebird.map(urlsWithContext,
    urlWithContext => req(urlWithContext.url)
      .delay(1000)
      .spread(response => extractEvents({
        response: response,
        urlWithContext: urlWithContext
      })
    ),
    {concurrency: 3}
  )

log.task('Loading base url to get cookies')

// parameters are not important as long as they are valid, making a request just to get cookies
req(eventsSearchUrl.url + '?state=CN&race=Road&fyear=&rrfilter=rr')
  // using spread since it parses arguments list from array to plain ones
  .spread(response => log.done(response.request.uri.href))
  .then(() => {
    log.task('Loading events for year ' + urlParams.fyear.toString().italic)
    return extractEventsFrom(urls)
  })
  .reduce((events, currentEvents) => events.concat(currentEvents))
  .then(events => {
    // log.json(events, 3)
    log.info('Total events: '.grey + events.length.toString().white)

    const fileName = 'all-years_all-states_all-types_noncomp-0_rrfilter-rr.json'

    jsonfile.writeFile(`data/${fileName}`, events, {spaces: 2}, (err) => {
      if (err) throw err
      log.done(`Saved events to "data/${fileName}"`)
    })
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
