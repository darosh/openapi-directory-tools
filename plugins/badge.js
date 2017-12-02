import got from '../lib/got'

const {obj} = require('through2')
const {log, colors, File} = require('gulp-util')
const {existsSync} = require('fs')
const {URL} = require('url')
const {join} = require('path')

const PLUGIN_NAME = 'badges'

export function badge (dest, badges) {
  return obj((file, enc, cb) => cb(null, file), function (cb) {
    Promise.all(badges.filter(d => !existsSync(join(dest, `${escape(d[0]).toLowerCase()}.svg`))).map(b => saveShield.apply(null, b))).then(all => {
      all.forEach((res, i) => {
        const path = `${escape(badges[i][0]).toLowerCase()}.svg`
        log(PLUGIN_NAME, 'saving', colors.blue(path))
        this.push(new File({
          path,
          contents: res.body
        }))
      })

      cb()
    })
  })
}

function saveShield (subject, status, color, icon) {
  subject = escape(subject)
  status = escape(status)

  const url = new URL(`https://img.shields.io/badge/${subject}-${status}-${color}.svg`)

  if (icon) {
    url.search = `logo=data:image/png;base64,${encodeURIComponent(icon)}`
  }

  log(PLUGIN_NAME, 'loading', colors.blue(url.pathname))

  return got(url.toString(), {encoding: null})
}

function escape (obj) {
  return obj.toString().replace(/_/g, '__').replace(/-/g, '--').replace(/ /g, '_')
}
