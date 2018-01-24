const fs = require('fs')
const prettier = require('prettier')

const makeDir = require('make-dir')
const path = require('path')

/* Wrappers for node-fs function that return promises and write JSON to files
*/

async function writeJsonToFile(fullFilePath, obj) {
  const dirName = path.dirname(fullFilePath)
  await makeDir(dirName)

  return new Promise((resolve, reject) => {
    let str = ''

    try {
      str = JSON.stringify(obj, null, 2) + '\n'
      str = prettier.format(str, { parser: 'json' })
    } catch (err) {
      reject(err)
    }

    fs.writeFile(fullFilePath, str, {}, err => {
      if (err) reject(err)

      resolve(fullFilePath)
    })
  })
}

async function appendJsonToFile(fullFilePath, obj, options, callback) {
  const dirName = path.dirname(fullFilePath)
  await makeDir(dirName)

  return new Promise((resolve, reject) => {
    let str = ''

    try {
      str = JSON.stringify(obj, null, 2) + '\n'
      str = prettier.format(str, { parser: 'json' })
    } catch (err) {
      reject(err)
    }

    fs.appendFile(fullFilePath, str, {}, err => {
      if (err) reject(err)

      resolve(fullFilePath)
    })
  })
}

module.exports = {
  writeJsonToFile,
  appendJsonToFile
}
