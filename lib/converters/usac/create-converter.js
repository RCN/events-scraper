const log = require('../common/log')
const { trim, groupBy, find, first } = require('lodash/fp')

const {
  createShortEventId,
  createPrettyEventId
} = require('@rcn/events-core/gen-event-id')

const {
  parseDate,
  parseLocation,
  parseDiscipline,
  parseType,
  createPromoterParser
} = require('./parsers')

const createConverter = ({ previousEvents, promoters }) => {
  const parsePromoter = createPromoterParser(promoters)

  const createRcnEventPropsFromUsac = rawUsacEvent => {
    const rawPermit = trim(rawUsacEvent.permit)
    const discipline = parseDiscipline(rawUsacEvent.discipline)

    return {
      name: trim(rawUsacEvent.name),
      date: parseDate(rawUsacEvent.dates),
      discipline: discipline,
      type: parseType({
        nameRaw: rawUsacEvent.name,
        discipline: discipline,
        competitive: rawUsacEvent.competitive
      }),
      location: parseLocation(rawUsacEvent.location),
      usacPermit: rawPermit,
      usac: {
        status: trim(rawUsacEvent.status),
        category: trim(rawUsacEvent.usacCategory),
        type: trim(rawUsacEvent.usacEventType)
      },
      websiteUrl: encodeURI(trim(rawUsacEvent.eventWebSite)),
      registrationUrl: encodeURI(trim(rawUsacEvent.registrationLink)),
      promoters: parsePromoter(rawUsacEvent.promoter)
    }
  }

  const createUpdatedEvent = (existingRcnEvent, rawUsacEvent) => {
    // TODO: implement support for moved events ^, basically we need to do extra pass and compare
    // if event with same permit got new date? if so, we would need to
    // - create a new event
    // - link old event to new one (movedToId)
    // - mark old one as moved
    return Object.assign(
      {},
      {
        id: existingRcnEvent.id,
        _shortId: existingRcnEvent._shortId
      },
      createRcnEventPropsFromUsac(rawUsacEvent)
    )
  }

  // TODO: move event creation to commmon
  const createNewEvent = rawUsacEvent => {
    const shortId = createShortEventId()

    log.cyan(`New event found "${rawUsacEvent.permit}: ${rawUsacEvent.name}"`)

    return Object.assign(
      {},
      {
        id: createPrettyEventId(
          rawUsacEvent.year,
          rawUsacEvent.name,
          'usac',
          shortId
        ),
        _shortId: shortId
      },
      createRcnEventPropsFromUsac(rawUsacEvent)
    )
  }

  const previousEventsByPermit = groupBy('usacPermit', previousEvents)

  return function convertUsacEventToRcnEvent(rawUsacEvent) {
    const existingRcnEvents = previousEventsByPermit[trim(rawUsacEvent.permit)]

    const existingRcnEvent = existingRcnEvents
      ? existingRcnEvents.length === 1
        ? first(existingRcnEvents)
        : find(
            // if multiple events exist, then match by discipline, because there ecould be same
            // event for different disciplines
            x => x.discipline === parseDiscipline(rawUsacEvent.discipline),
            existingRcnEvents
          )
      : undefined

    if (existingRcnEvent && existingRcnEvent.length > 1) {
      log.error(
        'Found two existing events with same discipline and permit number, ' +
          'which means we should go to USAC and double-check WTF is going on. ' +
          'This could also mean that event has been moved to a different date ' +
          'and we need to add support for this.'
      )
      log.debug(existingRcnEvent)
    }

    try {
      const rcnEvent = existingRcnEvent
        ? createUpdatedEvent(existingRcnEvent, rawUsacEvent)
        : createNewEvent(rawUsacEvent)

      return rcnEvent
    } catch (e) {
      log.error(e)
      log.error('Failed to parse event: ')
      log.error(rawUsacEvent)
    }
  }
}

module.exports = createConverter
