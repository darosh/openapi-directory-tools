import { getCache } from '../lib/cache'
import got from '../lib/got'

const {obj} = require('through2-concurrent')
const {log, colors} = require('gulp-util')
const {URL} = require('url')
const {extname} = require('path')
const {stat, createWriteStream} = require('fs')
const {join} = require('path')
const sanitize = require('sanitize-filename')
const mkdirp = require('mkdirp')
const MimeLookup = require('mime-lookup')
const MIME = new MimeLookup(require('mime-db'))

const PLUGIN_NAME = 'logo'

export function logo (dest, verbose) {
  const logoCache = {}
  mkdirp.sync(dest)

  return obj(function (file, enc, cb) {
    if (file.json.info && file.json.info['x-logo'] && file.json.info['x-logo'].url) {
      const logo = file.json.info['x-logo'].url
      let ext = extname(new URL(logo).pathname)

      if (!logoCache[logo]) {
        file.logo = logoCache[logo] = urlToFilename(logo)
        let target = join(dest, file.logo)

        if (!ext) {
          save(target, ext, file, logo, cb)
        } else {
          stat(target, (err) => {
            if (!err) {
              if (verbose) {
                log(PLUGIN_NAME, colors.green('found'), colors.grey(file.logo))
              }

              cb(null, file)
            } else {
              save(target, ext, file, logo, cb)
            }
          })
        }
      } else {
        file.logo = logoCache[logo]

        if (verbose) {
          log(PLUGIN_NAME, colors.green('exists'), colors.grey(file.logo))
        }

        cb(null, file)
      }
    } else {
      cb(null, file)
    }
  })

  function save (target, ext, file, logo, cb) {
    const stream = got.stream(logo, {cache: getCache(), bypass: !ext})
      .on('response', (res) => {
        if (!ext) {
          const mime = res.headers['content-type']
          ext = `.${MIME.extension(mime)}`
          target += ext
          logoCache[logo] += ext
          file.logo = logoCache[logo]
        }

        stream.pipe(createWriteStream(target))

        log(PLUGIN_NAME, colors.grey(res.fromCache ? 'cached' : 'downloaded'), colors.blue(logo))

        cb(null, file)
      })
      .on('error', () => {
        log(PLUGIN_NAME, colors.red('missing'), colors.red(logo))
        cb(null, file)
      })
  }
}

function urlToFilename (url, stripQuery = true) {
  if (stripQuery) {
    url = new URL(url)
    url.search = ''
    url = url.toString()
  }

  return sanitize(url, {replacement: '_'}).replace(/_+/, '_')
}
