const path = require('path')
const axios = require('axios')
const { log } = require('console-tools')
const chalk = require('chalk')
const logHttpError = require('./utils/log-http-error')

const toBase64 = content => new Buffer(content).toString('base64')

async function createOrUpdateFile(
  config,
  repoPath,
  { relativeGithubFilePath, content, branch }
) {
  try {
    const http = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${config.GITHUB_PERSONAL_ACCESS_TOKEN}`
      }
    })

    console.info('🥓')
    console.log('repoPath=', repoPath, 'relativeGithubFilePath=', relativeGithubFilePath)

    const filePath = branch
      ? path.join(repoPath, '/contents', relativeGithubFilePath) + `?ref=${branch}`
      : path.join(repoPath, '/contents', relativeGithubFilePath)

    const fileGetResponse = await http.get(filePath, {
      // reject only if status is not 200-299 or 404
      validateStatus: status => (status >= 200 && status < 300) || status === 404
    })

    const commonPayload = {
      committer: {
        name: 'Anton Vynogradenko',
        email: 'restuta8@gmail.com'
      },
      branch: branch,
      content: toBase64(content)
    }

    if (fileGetResponse.status === 404) {
      log.info('GITHUB CLIENT: File does not exist, creating one...')

      await http
        .put(filePath, {
          ...commonPayload,
          message: `[auto] created file ${relativeGithubFilePath}`
        })
        .catch(err => {
          log.fail('GITHUB CLIENT: File creation failed')
          logHttpError(err)
          throw err
        })
    } else {
      log.info('GITHUB CLIENT: File exists, updating...')

      const { sha } = fileGetResponse.data

      const response = await http
        .put(filePath, {
          ...commonPayload,
          message: `[auto] updated file ${relativeGithubFilePath}`,
          sha: sha
        })
        .catch(err => {
          log.fail('GITHUB CLIENT: File update failed')
          logHttpError(err)
          throw err
        })
      console.dir(response.status, { colors: true, depth: 1 })
    }
  } catch (err) {
    console.error(chalk.red(err))
    console.dir(err, { colors: true, depth: 1 })
    throw err
  }
}

module.exports = createOrUpdateFile
