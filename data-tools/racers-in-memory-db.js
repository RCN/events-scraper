/* playground to load racers in memory and play with it */

const walkSync = require('walk-sync')
const P = require('bluebird')
const { log } = require('console-tools')
const readJsonFile = require('./utils/read-json-file')
const { take, flatten, keyBy, keys, isNaN: isNotANumber } = require('lodash/fp')
const path = require('path')

const csv = require('csvtojson')

const getRacersWithouthZip = () =>
  new Promise((resolve, reject) => {
    const rawRacers = []
    csv()
      .fromFile(
        path.resolve(
          './data-tools/ncnca-racers-no-zip/ncnca-racers-with-no-zip.csv'
        )
      )
      .on('json', jsonObj => {
        rawRacers.push(jsonObj)
      })
      .on('done', error => {
        if (error) {
          log.error(error)
          reject(error)
        }

        log.debug(
          `Orginal raw entries in CSV file: ${rawRacers.length}`
        )
        const racers = rawRacers.map(x => ({
          name: x['Name'],
          licenseNo: parseInt(x['License #'])
        }))

        resolve(racers.filter(x => !isNotANumber(x.licenseNo)))
      })
  })

// getRacersWithouthZip().then(racers => {
//   // log.json(racers)
// })

const getAllRacers = () => {
  const racersFilePaths = walkSync
    .entries('./data', {
      directories: false,
      globs: ['racers**.json']
    })
    .map(entry =>
      Object.assign({}, entry, {
        fullPath: path.join(entry.basePath, entry.relativePath)
      })
    )

  return P.map(
    racersFilePaths,
    entry => readJsonFile(entry.fullPath),
    { concurrency: 100 }
  )
    .then(results => flatten(results))
    .then(results => {
      log.task('Bulding index by license number...')
      const indexedRacers = keyBy('licenceNo', results)
      log.done('Indexing is done!')
      return indexedRacers
    })
}

// getAllRacers().then(racers => {
//   log.debug(keys(racers).length)
// })

P.props({
  allRacers: getAllRacers(),
  racersWithoutZip: getRacersWithouthZip()
}).then(({ allRacers, racersWithoutZip }) => {
  log.info(`Total racers: ${keys(allRacers).length}`)
  log.info(`Racers withouth zip: ${racersWithoutZip.length}`)

  const notFoundRacers = racersWithoutZip.filter(x => {
    const matchedRacer = allRacers[x.licenseNo]
    if (!matchedRacer) {
      return x
    }
  })

  log.debug(`Not found racers: ${notFoundRacers.length}`)

  racersWithoutZip.map(x => {
    const matchedRacer = allRacers[x.licenseNo]

    if (matchedRacer) {
      // log.json(matchedRacer)
    } else {
      // log.json(x)
    }

    return x
  })
})

function run() {}

module.exports = run
