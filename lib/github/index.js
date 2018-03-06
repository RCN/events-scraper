const { createGithubClient } = require('./client')
// const fs = require('fs')
// const ncncaEventsJson = fs.readFileSync('.' + path, 'utf8')
const { log } = require('console-tools')

const decodeBase64 = content => new Buffer(content, 'base64').toString()

// path should start form `/`
const createGithubRepo = ({ repoPath }) => {
  const githubClient = createGithubClient({ repoPath })

  return {
    commitFileToGithub({ relativeFilePath, content, branch = 'master' }) {
      return githubClient
        .createOrUpdateFile({
          relativeGithubFilePath: relativeFilePath,
          content,
          branch
        })
        .then(result => {
          log.task(
            `Commited file to github, file="${relativeFilePath}", repo="${repoPath}", branch="${branch}"`
          )
          return result
        })
    },
    getFileFromGithub({ relativeFilePath, branch = 'master' }) {
      return githubClient
        .getFileContents({ relativeGithubFilePath: relativeFilePath, branch })
        .then(result => {
          if (result.status === 404) {
            log.warn(
              `File was not found on github, file="${relativeFilePath}", repo="${repoPath}", branch="${branch}`
            )
            return undefined
          }

          log.task(
            `Fetched file from github, file="${relativeFilePath}", repo="${repoPath}", branch="${branch}`
          )
          const encodedFileContent = result.data && result.data.content
          const fileContent = decodeBase64(encodedFileContent)

          return fileContent
        })
    }
  }
}

// const eventsRepo = createGithubRepo({ repoPath: '/RCN/events-scraper' })
// eventsRepo
//   .getFileFromGithub({ relativeFilePath: '/package.json' })
//   .then(fileContents =>
//     console.dir(JSON.parse(fileContents), { colors: true, depth: 4 })
//   )

module.exports = createGithubRepo
