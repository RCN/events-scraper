import log from 'console-tools'
import _ from 'lodash'
import moment from 'moment'
import cheerio from 'cheerio' // jQuery-like HTML manipulation

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

  // scrapes event dates, could be one or many in case of multi-day events, returns array in any case
  scrapeDate(tdContainingCategory) {
    for (var i = 0; i < tdContainingCategory.children.length; i++) {
      if (tdContainingCategory.children[i].type === 'text') {
        var datesString = (tdContainingCategory.children[i].data || '').trim()

        // assuming all dates use "/" as a separator
        if (!datesString.contains('/')) {
          continue
        }

        var rawDates
        var multiDayEvent = datesString.contains(' - ')

        if (multiDayEvent) {
          rawDates = datesString.split(' - ')
        } else {
          rawDates = [datesString]
        }

        var dates = _.map(rawDates, item => moment(new Date(item)))

        // if every date is valid, map dates to ISO strings
        if (_.every(dates, date => date.isValid())) {
          return _.map(dates, date => date.toISOString())
        }
      }
    }

    // todo: add error message here with context object
    log.error('UsaCyclingScraper.scrapeDate() failed for:')
    log.json(this.context)

    return []
  }

  parseDetailedAddress(addressString) {
    // e.g. "East Side of San Bruno Mtn<br>Brisbane, CA"
    let result = addressString || ''

    if (result.contains('<br>')) {
      result = result.replace('<br>', '\n').lines()
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

  getFriendlyUsacTypeNames(nonFriendlyName) {
    switch (nonFriendlyName) {
      case 'r':
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

export default function extractEvents({response, urlWithContext}) {
  let $ = cheerio.load(response.body)
  // var year = params.year
  let $events = $('.event')
  let events = []

  const scraper = new UsaCyclingScraper(urlWithContext)
  const url = urlWithContext.url
  const context = urlWithContext.context

  $events.each((index, eventElement) => {
    log.json(urlWithContext)
    const $event = $(eventElement)
    const $eventDetailsSpan = $event.find('span.event_detail')
    const $eventDetailsDiv = $event.find('div.event_detail')
    const $linksInDetailsDivTd0 = $eventDetailsDiv.find('table td').eq(0).find('a')
    const $linksInDetailsDivTd1 = $eventDetailsDiv.find('table td').eq(1).find('a')

    // var $linksInDetailsDivTd2 = $eventDetailsDiv.find('table td').eq(2).find('a')

    let event = {
      permit: $eventDetailsDiv.attr('id').chompLeft('permit_').toString(),
      name: $event.find('.title').text(),
      dates: scraper.scrapeDate($eventDetailsDiv.find('table td').get(0)),
      // using emulated DOM Node object to get text of the inner node, since $().text() gets text of all inner elements
      location: {
        cityState: $eventDetailsSpan[0].children[1].data.trim(),
        detailed: scraper.parseDetailedAddress($linksInDetailsDivTd0.eq(0).html()),
        googleMapsUrl: $linksInDetailsDivTd0.eq(0).attr('href')
      },
      promoter: {
        club: $linksInDetailsDivTd1.eq(0).text(),
        raceDirector: $linksInDetailsDivTd1.eq(1).text(),
        // todo: if relative link prefix with "https://www.usacycling.org"
        url: $linksInDetailsDivTd1.eq(0).attr('href')
      },
      eventWebSite: scraper.scrapeEventWebsite($linksInDetailsDivTd0.eq(2)),
      // todo: status is not always extracted correctly
      status: $eventDetailsDiv.find('table td font').text(),
      usacCategory: scraper.scrapeCategory($eventDetailsDiv.find('table td').get(2)), // table's third td

      // getting context params
      year: context.year,
      state: context.state,
      discipline: context.discipline,
      usacEventType: scraper.getFriendlyUsacTypeNames(context.usacEventType),
      competitive: (context.noncomp === 0 ? 'competitive' : 'non-competitive'),

      // technical props, should start from underscore
      _urlUsedToPullThisEvent: url
    }

    // log.json(event.dates[0] + " " + event.title)
    // log.json(event)
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
