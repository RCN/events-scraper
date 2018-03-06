const path = require('path')
const config = require('./config')
const R = require('ramda')

const createOrUpdateFile = require('./create-or-update-file')
const getFileContents = require('./get-file-contents')

const createGithubClient = ({ repoPath }) => {
  const apiRepoPath = path.join('/repos', repoPath)

  return {
    createOrUpdateFile: R.partial(createOrUpdateFile, [config, apiRepoPath]),
    getFileContents: R.partial(getFileContents, [config, apiRepoPath])
  }
}

module.exports = {
  createGithubClient
}
