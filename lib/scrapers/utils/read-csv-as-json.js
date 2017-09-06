const csv = require('csvtojson')
const path = require('path')
const { log } = require('console-tools')

// './data-tools/ncnca-racers-no-zip/ncnca-racers-with-no-zip.csv'
const readCsvAsJson = filePath =>
  new Promise((resolve, reject) => {
    const jsonArr = []
    csv()
      .fromFile(path.resolve(filePath))
      .on('json', jsonObj => jsonArr.push(jsonObj))
      .on('done', error => {
        if (error) {
          log.error(error)
          reject(error)
        }

        log.debug(
          `Orginal raw entries in CSV file: ${jsonArr.length}`
        )

        resolve(jsonArr)
      })
  })

module.exports = readCsvAsJson
