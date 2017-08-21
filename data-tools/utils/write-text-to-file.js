const fs = require('fs')

function writeTextToFile(file, text, options = {}) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, text, {}, err => {
      if (err) reject(err)

      resolve(file)
    })
  })
}

module.exports = writeTextToFile
