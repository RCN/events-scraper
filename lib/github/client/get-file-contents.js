const path = require('path')
const axios = require('axios')
const { log } = require('console-tools')
const chalk = require('chalk')

const logHttpError = require('./utils/log-http-error')

async function getFileContents(
  config,
  repoPath,
  { relativeGithubFilePath, branch = 'master' }
) {
  try {
    const http = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${config.GITHUB_PERSONAL_ACCESS_TOKEN}`
      }
    })

    const filePath = branch
      ? path.join(repoPath, '/contents', relativeGithubFilePath) + `?ref=${branch}`
      : path.join(repoPath, '/contents', relativeGithubFilePath)

    const fileGetResponse = await http
      .get(filePath, {
        // do not fail on 404 since file that doesn't exist should not throw an error
        validateStatus: status => (status >= 200 && status < 300) || status === 404
      })
      .catch(err => {
        log.fail(`GITHUB CLIENT: File "${filePath}"" doesn't exist.`)
        logHttpError(err)
        throw err
      })

    return fileGetResponse
  } catch (err) {
    console.error(chalk.red(err))
    console.dir(err, { colors: true, depth: 1 })
    throw err
  }
}

module.exports = getFileContents
