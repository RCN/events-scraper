import {buildUrlsFor} from 'url-utils'

const buildUrls = () => {
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

  // const eventTypes = ['rr', 'F', 'sr'] //rr - ranking, F - fun events, sr - state or regional champs

  // event counts are split by low-med-high to optimize amount of requests we are making with ctn (paging) params
  const lowEventCountStates = ['AZ', 'NV', 'OR', 'WA', 'UT', 'ID', 'MT', 'WY', 'NM', 'OK', 'KS', 'NE',
    'SD', 'ND', 'MN', 'MO', 'AR', 'LA', 'MS', 'IL', 'WI', 'AL', 'GA', 'SC', 'KY', 'VA', 'WV',
    'OH', 'IN', 'MI', 'DC', 'MD', 'DE', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME', 'HI', 'AK'
  ] // ctn=40
  const mediumEventCountStates = ['CS', 'NJ', 'FL', 'CO', 'NC', 'IA', 'TX'] // ctn=60
  const highEventCountStates = ['PA'] // ctn=100
  const extraHightEventcountStates = ['CN'] // ctn=120

  let baseUrls = buildUrlsFor([eventsSearchUrl], {urlParam: 'ajax', values: [2]})
  let urlsWithYears = buildUrlsFor(baseUrls, {urlParam: 'fyear', contextParam: 'year',
    values: [2005, 2006, 2007, 2008, 2009, 2010, 2012, 2014, 2015, 2016]})

  const buildUrlsForStatesWithCtn = (urls, states, ctn) => {
    const buildUrlsForRankingEvents = (urls) => {
      const disciplines = ['Road', 'Track', 'Mountain', 'Cyclocross', 'Collegiate', 'BMX']
      let newUrls = [].concat(urls)
      newUrls = buildUrlsFor(newUrls, {urlParam: 'race', contextParam: 'discipline', values: disciplines})
      newUrls = buildUrlsFor(newUrls, {urlParam: 'rrfilter', contextParam: 'usacEventType', values: ['rr']})
      newUrls = buildUrlsFor(newUrls, {urlParam: 'noncomp', contextParam: 'noncomp', values: [0]})
      return newUrls
    }

    let urlsForStates = buildUrlsForRankingEvents(urls)
    urlsForStates = buildUrlsFor(urlsForStates, {urlParam: 'state', contextParam: 'state', values: states})
    urlsForStates = buildUrlsFor(urlsForStates, {urlParam: 'cnt', values: ctn})
    return urlsForStates
  }

  let urlsForLowEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, lowEventCountStates, [0, 20, 40])
  let urlsForMidEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, mediumEventCountStates, [0, 20, 40, 60])
  let urlsForHighEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, highEventCountStates, [0, 20, 40, 60, 80, 100])
  let urlsForExtraHighEventCountStates = buildUrlsForStatesWithCtn(urlsWithYears, extraHightEventcountStates, [0, 20, 40, 60, 80, 100, 120])

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
  
  return urls
}

export default buildUrls
