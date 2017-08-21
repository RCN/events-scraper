/* playground to load racers in memory and play with it */

const walkSync = require('walk-sync')
const P = require('bluebird')
const { log } = require('console-tools')
const readJsonFile = require('./utils/read-json-file')
const { pipe, map, pick, flatten, keyBy, isNaN: isNotANumber } = require('lodash/fp')
// const fp = require('lodash/fp')
const path = require('path')
const json2csv = require('json2csv')
const writeTextToFile = require('./utils/write-text-to-file')

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
    .then(allRacers => {
      log.task('Bulding index by license number...')
      const indexedRacers = keyBy('licenceNo', allRacers)
      log.done('Indexing is done!')
      return {
        indexedRacers,
        allRacers,
      }
    })
}

// getAllRacers().then(racers => {
//   log.debug(keys(racers).length)
// })

P.props({
  racers: getAllRacers(),
  racersWithoutZip: getRacersWithouthZip()
}).then(({ racers, racersWithoutZip }) => {
  const { indexedRacers, allRacers } = racers

  log.info(`Total racers: ${allRacers.length}`)
  log.info(`Racers withouth zip: ${racersWithoutZip.length}`)

  const preparedRacers = pipe(
    map(pick(['licenceNo', 'name', 'address', 'age', 'raceCount']))
  )(allRacers)

  writeTextToFile('./all-racers.csv', json2csv({ data: preparedRacers }))
    .then((fileName) => log.done(`CSV file saved: "${fileName}"`))

  // const foundRacers = fp.pipe(
  //   fp.flatMap(racerWithoutZip => (allRacers[racerWithoutZip.licenseNo] || []))
  // )(racersWithoutZip)

  // 402 before pulling new
  // log.warn(`Not found racers: ${racersWithoutZip.length - foundRacers.length}`)
  // log.done(`Found racers: ${foundRacers.length}`)

  // output uniq locations
  // log.json(pipe(
  //   map(pick('address')),
  //   uniqBy('address')
  // )(foundRacers))

  // const preparedRacers = pipe(
  //   map(pick(['licenceNo', 'name', 'address', 'age', 'raceCount']))
  // )(foundRacers)

  // ouput sample CSV
  // console.log(
  //   json2csv({ data: fp.take(10, preparedRacers) })
  // )
  //

  // writeTextToFile('./racers-with-zips.csv', json2csv({ data: preparedRacers }))
  //   .then(() => log.done('CSV file saved: "racers-with-zips.csv"'))
})

function run() {}

module.exports = run
