const chalk = require('chalk')

const logHttpError = err => {
  if (err && err.stack) {
    console.error(chalk.red(err.stack))
  } else {
    console.trace()
    console.dir(err, { colors: true, depth: 0 })
  }
}

module.exports = logHttpError
