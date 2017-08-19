const jsonfile = require('jsonfile')

const readFile = path =>
  new Promise((resolve, reject) =>
    jsonfile.readFile(path, (err, obj) => {
      if (err) {
        reject(err)
      }

      resolve(obj)
    })
  )

module.exports = readFile
