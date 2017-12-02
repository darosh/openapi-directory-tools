import { getCache } from './cache'
import got from './got'

const tar = require('tar-stream')
const minimatch = require('minimatch')
const zlib = require('zlib')

export function listGitHubFilesAsync (user, repo, glob) {
  return new Promise((resolve, reject) => {
    const extract = tar.extract()
    let data = []

    extract.on('entry', function (header, stream, cb) {
      if (minimatch(header.name, glob)) {
        data.push(header.name.replace(`${repo}-master/`, ''))
      }

      stream.resume()
      cb()
    })

    extract.on('finish', function () {
      resolve(data)
    })

    const MINUTE = 1000 * 60

    const url = `https://codeload.github.com/${user}/${repo}/tar.gz/master`
    // const url = `https://github.com/${user}/${repo}/archive/master.tar.gz`

    got.stream(url, {
      cache: getCache(),
      timeout: 5 * MINUTE,
      retries: 3,
      headers: {
        // 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
        accept: '*/*'
      }
    })
      .on('error', err => {
        reject(err)
      })
      .pipe(zlib.createGunzip())
      .pipe(extract)
  })
}

export function rawGitHubUrl (user, repo, path) {
  return `https://raw.githubusercontent.com/${user}/${repo}/master/${path}`
}
