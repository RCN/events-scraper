import { log } from 'console-tools'
import _ from 'lodash'
import moment from 'moment'
import cheerio from 'cheerio' // jQuery-like HTML manipulation
import Url from 'url'

// TODO: url for cross-referencing event types:
  //  https://www.usacycling.org/events/?advanced=1
  //  https://www.usacycling.org/events/?race=Road&state=CA&zipcode=&radius=50&end_date_mon=1&end_date_day=1&end_date_year=2018&start_date_mon=1&start_date_day=1&start_date_year=2017&event=
// TODO: url for particular event by permit number:
  // http://www.usacycling.org/events/index.php?event=1822&year=2011

// class containing all the scraping and parsing logic for USA Cycling
// context represents current scraping context with url, url params, etc, mostly used for debugging
class UsaCyclingScraper {
  constructor(context) {
    this.context = context // crawiling context like url and other params
  }

  scrapeCategory(tdContainingCategory) {
    var category = ''

    // todo: use _ each or some other for each
    // using "children" property, since tdContainingCategory is cheerio object, in DOM it would be "childNodes"
    for (var i = 0; i < tdContainingCategory.children.length; i++) {
      if (tdContainingCategory.children[i].type === 'text') {
        category = (tdContainingCategory.children[i].data || '').trim()
      }
    }

    return category
  }

  scrapeDateFromTitle(spanWithDate) {
    return this._parseDates(spanWithDate.text())
  }

  _parseDates(datesString) {
    let rawDates
    let multiDayEvent = datesString.includes(' - ')

    if (multiDayEvent) {
      rawDates = datesString.split(' - ')
    } else {
      rawDates = [datesString]
    }

    let dates = _.map(rawDates, item => moment(new Date(item)))

    // if every date is valid, map dates to ISO strings
    if (_.every(dates, date => date.isValid())) {
      return _.map(dates, date => date.toISOString())
    }
  }

  // scrapes event dates, could be one or many in case of multi-day events, returns array in any case
  scrapeDate(tdContainingCategory) {
    for (var i = 0; i < tdContainingCategory.children.length; i++) {
      if (tdContainingCategory.children[i].type === 'text') {
        var datesString = (tdContainingCategory.children[i].data || '').trim()
        // assuming all dates use "/" as a separator
        if (!datesString.includes('/')) {
          continue
        }

        let parsedDates = this._parseDates(datesString)
        if (parsedDates) {
          return parsedDates
        }
      }
    }

    return null
  }

  parseDetailedAddress(addressString) {
    // e.g. "East Side of San Bruno Mtn<br>Brisbane, CA"
    let result = addressString || ''

    if (result.includes('<br>')) {
      result = result.replace('<br>', '\n').split(/\r?\n/)
        .filter(x => x)
        .map(x => x.trim())
    } else {
      result = result.trim()
    }

    return result
  }

  scrapeEventWebsite(htmlElement) {
    return (htmlElement.text().trim() === 'Event Website')
      ? htmlElement.attr('href')
      : undefined
  }

  toAbsoluteUsacUrl(url) {
    if (!url) return

    return (url.startsWith('http'))
      ? url
      : Url.resolve('https://usacycling.org', url)
  }

  getFriendlyUsacTypeNames(nonFriendlyName) {
    switch (nonFriendlyName) {
      case 'rr':
        return 'Results & Ranking'
      case 'F':
        return 'Fun'
      case 'sr':
        return 'State or Regional Championships'
      default:
        return ''
    }
  }
}

// gets event type by image path, it's weird way, but it works
const getEventTypeByImagePath = ({ imagePath }) => {
  if (!imagePath) {
    return ''
  } else if (imagePath.includes('smallrank')) {
    return 'Results & Ranking'
  } else if (imagePath.includes('funride')) {
    return 'Fun'
  } else {
    throw new Error(`Can't get event type by image path, unknown image path: "${imagePath}"`)
  }
}

export default function extractEvents({response, urlWithContext}) {
  let $ = cheerio.load(response.body)
  // var year = params.year
  let $events = $('.event')
  let events = []

  const scraper = new UsaCyclingScraper(urlWithContext)
  const url = urlWithContext.url
  const context = urlWithContext.context

  const findLinkHrefMatchingText = (text, $links) => {
    const links = $links.filter((i, elem) => $(elem).text().trim() === text)
    return links ? $(links).attr('href') : null
  }

  $events.each((index, eventElement) => {
    const $event = $(eventElement)
    const $eventDetailsSpan = $event.find('span.event_detail')
    const $eventDetailsDiv = $event.find('div.event_detail')
    const $linksInDetailsDivTd0 = $eventDetailsDiv.find('table td').eq(0).find('a')
    const $linksInDetailsDivTd1 = $eventDetailsDiv.find('table td').eq(1).find('a')
    const eventTypeImagePath = $event.find('div.event_rank img').attr('src')

    // email address is javascript-protected, they use eval() func to hide them, while it's
    // doable it's not worth the trouble (requires eval, couldn't get it working)

    // const promoterContactEmail = $eventDetailsDiv.find('table td').eq(1).find('script')
    // const script = promoterContactEmail.text()
    //   .replace('/*<![CDATA[*/eval(', '')
    //   .replace(')/*]]>*/', '')

    // let fakeDomElement = { innerHTML: '' }
    // const document = { getElementById: () => fakeDomElement }
    // console.log(script)
    // eval(script)
    // log.json(fakeDomElement.innerHTML)

    // log.json(promoterContactEmail.text())

    const dates = scraper.scrapeDate($eventDetailsDiv.find('table td').get(0)) ||
      scraper.scrapeDateFromTitle($eventDetailsSpan.find('span'))

    if (!dates || dates.length === 0) {
      // todo: add error message here with context object
      log.error('Data Parsing failed failed for:')
      log.json(context)
    }

    let event = {
      permit: _.trimStart($eventDetailsDiv.attr('id'), 'permit_'),
      name: $event.find('.title').text().trim(),
      dates: dates,
      // using emulated DOM Node object to get text of the inner node, since $().text() gets text of all inner elements
      location: {
        cityState: $eventDetailsSpan[0].children[1].data.trim(),
        detailed: scraper.parseDetailedAddress($linksInDetailsDivTd0.eq(0).html()),
        googleMapsUrl: $linksInDetailsDivTd0.eq(0).attr('href')
      },
      promoter: {
        club: $linksInDetailsDivTd1.eq(0).text().trim(),
        raceDirector: $linksInDetailsDivTd1.eq(1).text().trim(),
        url: scraper.toAbsoluteUsacUrl($linksInDetailsDivTd1.eq(0).attr('href')),
      },
      eventWebSite: findLinkHrefMatchingText('Event Website', $linksInDetailsDivTd0),
      registrationLink: scraper.toAbsoluteUsacUrl(
        findLinkHrefMatchingText('Online Registration', $linksInDetailsDivTd0)
      ),
      // TODO: status is not always extracted correctly
      status: $eventDetailsDiv.find('table td font').text().trim(),
      usacCategory: scraper.scrapeCategory($eventDetailsDiv.find('table td').get(2)), // table's third td

      // getting context params
      year: context.year,
      state: context.state,
      discipline: context.discipline,
      // first get type from context, then fall back to image path
      usacEventType: scraper.getFriendlyUsacTypeNames(context.usacEventType) ||
        getEventTypeByImagePath({ imagePath: eventTypeImagePath }),
      competitive: (context.noncomp === 0 ? 'competitive' : 'non-competitive'),

      // technical props, should start from underscore
      _urlUsedToPullThisEvent: url
    }

    // log.json(event.dates[0] + " " + event.title)
    events.push(event)
  })

  var eventsCount = events.length
  var formattedMessage = `[${eventsCount} events] ` + response.request.uri.href

  // usually it's no less then 19 events, yeah, pretty magic number
  if (eventsCount >= 1) {
    log.done(formattedMessage)
  } else if (eventsCount === 0) {
    log.warn(formattedMessage)
  }

  return events
}
