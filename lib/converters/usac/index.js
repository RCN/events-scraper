const log = require('../common/log')
// prettier-ignore
const { flow,map, groupBy, filter, concat } = require('lodash/fp')
const { Statuses } = require('@rcn/events-core/event-types')

const Joi = require('joi')
const schema = require('@rcn/events-core/event.schema')
const createGithubRepo = require('github')
const createConverter = require('./create-converter')

const updateEventsThatAreNoLongerOnUsac = previousEvents => justConvertedEvents => {
  const justConvertedEventsByPermit = groupBy('usacPermit', justConvertedEvents)

  const eventsThatAreNoLongerOnUsac = flow(
    filter(event => !justConvertedEventsByPermit[event.usacPermit]),
    map(event =>
      Object.assign({}, event, {
        status: Statuses.canceled,
        cancelationReason:
          'Unknown, event is likely canceled, since it got removed from USAC website.'
      })
    )
  )(previousEvents)

  if (eventsThatAreNoLongerOnUsac.length > 0) {
    eventsThatAreNoLongerOnUsac.forEach(x => {
      log.yellow(
        `Removed event "${x.usacPermit}: ${x.name}" USAC, marking as Canceled`
      )
    })
  }

  return concat(justConvertedEvents, eventsThatAreNoLongerOnUsac)
}

const updateRegLinks = previousEvents => justConvertedEvents => {
  const previousEventsByPermit = groupBy('usacPermit', previousEvents)
  const getRegistrationUrl = (usacStatus, newRegUrl, prevRegUrl) => {
    if (usacStatus === 'Complete' && newRegUrl === '') {
      return prevRegUrl
    } else {
      return newRegUrl
    }
  }

  // for each just converted event figure out if reg-link has to be updated or not
  // since USAC removes reg links for completed events and we don't want that
  const processedEvents = justConvertedEvents.map(justConvertedEvent => {
    const [prevEvent] = previousEventsByPermit[justConvertedEvent.usacPermit] || []

    return prevEvent
      ? {
          ...justConvertedEvent,
          registrationUrl: getRegistrationUrl(
            justConvertedEvent.usac.status,
            justConvertedEvent.registrationUrl,
            prevEvent.registrationUrl
          )
        }
      : justConvertedEvent
  })

  return processedEvents
}

const validateOverSchema = rcnEvent => {
  const { value: event, error } = Joi.validate(rcnEvent, schema)

  if (error) {
    // log.error(`${event.usacPermit} failed schema validaiton: ${error}`)
    throw new Error(`${event.usacPermit} failed schema validaiton: ${error}`)
  } else {
    // log.cyan(`${event.id} passed Joi schema validation`)
  }

  return rcnEvent
}

// TODO: check if file exists, if it doesn't assume all events are new
// const relativePathToConvertedEvents =
//   '../../../../client/temp/data/2017-usac-events.json'
// const absolutePathToConvertedEvents = path.resolve(
//   __dirname,
//   relativePathToConvertedEvents
// )
// const previousEvents = require(relativePathToConvertedEvents)

const getJsonFileFromGithub = async ({ repoPath, filePath }) => {
  const eventsRepo = createGithubRepo({ repoPath })
  const fileContent = await eventsRepo.getFileFromGithub({
    relativeFilePath: filePath
  })
  return fileContent && JSON.parse(fileContent)
}

// main processing pipeline
const processEvents = (convertUsacEventToRcnEvent, previousEvents) =>
  flow(
    map(convertUsacEventToRcnEvent),
    // , map(log.debug)
    updateEventsThatAreNoLongerOnUsac(previousEvents),
    updateRegLinks(previousEvents),
    map(validateOverSchema),
    // TODO bc: order events by date so we write them to disk in somewhat consistent order
    // only write to file in prod mode
    process.env.NODE_ENV === 'development'
      ? x => Promise.resolve(x)
      : x => Promise.resolve(x) // push to github
    // : partial(writeJsonToFile, [absolutePathToConvertedEvents])
  )

async function main() {
  //TODO: fetch promoters and pass down to one of the parsers
  const previousEvents = await getJsonFileFromGithub({
    repoPath: '/restuta/rcn.io',
    filePath: 'src/client/temp/data/2017-usac-events.json'
  })

  const promoters = await getJsonFileFromGithub({
    repoPath: 'restuta/rcn.io',
    filePath: 'src/client/temp/data/2017-ncnca-promoters.json'
  })

  const convertUsacEventToRcnEvent = createConverter({ previousEvents, promoters })

  // console.dir(promoters, { colors: true, depth: 4 })

  // console.dir(previousEvents, { colors: true, depth: 4 })

  //2017-USAC-CN-road
  const usac2017CnRoadEvensRaw = require('../../../data/events/2017/CN_all.json')
  processEvents(convertUsacEventToRcnEvent, previousEvents)(
    usac2017CnRoadEvensRaw
  ).then(events => {
    log.green(`Converted ${usac2017CnRoadEvensRaw.length} events`)
  })
}

main()
