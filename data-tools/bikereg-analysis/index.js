const { log } = require('console-tools')
const f = require('lodash/fp')
const { countBy } = require('../utils/analytics')

const concatMany = arrays => f.reduce((result, arr) => f.concat(result, arr), [], arrays)

const events = concatMany([
  require('../../data/bikereg/2017-bikereg-events.json'),
  require('../../data/bikereg/2016-bikereg-events.json'),
  require('../../data/bikereg/2015-bikereg-events.json'),
  require('../../data/bikereg/2014-bikereg-events.json'),
  require('../../data/bikereg/2013-bikereg-events.json'),
  require('../../data/bikereg/2012-bikereg-events.json'),
  require('../../data/bikereg/2011-bikereg-events.json'),
  // require('../../data/bikereg/2010-bikereg-events.json'),
])

log.debug('Total events: ' + events.length)

log.json(
  f.pipe(
    // f.filter(event => event.EventState === 'CA'),
    f.filter(event => event.EventName.toLowerCase().includes('criterium')),
    countBy('EventTypes.1'),
    // f.take(10)
  )(events)
)
