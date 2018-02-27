const path = require('path')

const axios = require('axios')
const { log } = require('console-tools')
const config = require('./config')
const chalk = require('chalk')
const http = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${config.GITHUB_PERSONAL_ACCESS_TOKEN}`
  }
})

const repoPath = '/repos/RCN/events-scraper/contents'
// const filePath = `${repoPath}/data/ncnca/events/2018.json`

async function createOrUpdateFile(relativeFilePath, contentInBase64) {
  try {
    const filePath = path.join(repoPath, relativeFilePath)
    const fileGetResponse = await http.get(filePath, {
      // reject only if status is not 200-299 or 404
      validateStatus: status => (status >= 200 && status < 300) || status === 404
    })

    if (fileGetResponse.status === 404) {
      console.info('file does not exist')
      //TODO: create file
    }

    const { sha } = fileGetResponse.data

    const response = await http.put(filePath, {
      message: 'updating file automatically...',
      committer: {
        name: 'Anton Vynogradenko',
        email: 'restuta8@gmail.com'
      },
      content: contentInBase64,
      sha: sha
    })
    console.dir(response.data, { colors: true, depth: 4 })
  } catch (err) {
    console.error(chalk.red(err))
    console.dir(err, { colors: true, depth: 4 })
    // console.dir(err.response.data, { colors: true, depth: 4 })
  }
}

// const ncnca2018 = require('../../data/ncnca/events/2018.json')
const toBase64 = content => new Buffer(content).toString('base64')

const fs = require('fs')
const ncncaEventsJson = fs.readFileSync('./data/ncnca/events/2018.json', 'utf8')

createOrUpdateFile(
  '/data/ncnca/events/2018.json',
  toBase64(ncncaEventsJson)
).then(() => {
  console.log('Done!!!')
})
//.catch(err => log.error(err))

module.exports = {
  createOrUpdateFile
}
