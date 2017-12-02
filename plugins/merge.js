import { normalizePath } from '../lib/normalizePath'

const {log, colors, File} = require('gulp-util')
const glog = require('gulplog')
const {obj} = require('through2')

const PLUGIN_NAME = 'merge'

export function merge (field = 'json', target = 'json') {
  const get = require('lodash/get')
  const items = {}

  return obj(function (file, enc, cb) {
    const id = normalizePath(file.relative)

    if (typeof field === 'string') {
      items[id] = get(file, field)
    } else {
      items[id] = field(file)
    }

    glog.debug(PLUGIN_NAME, `${colors.yellow(id)}`)
    cb()
  }, function (cb) {
    log(`Merged ${colors.magenta(Object.keys(items).length)} items`)

    const file = new File({
      path: 'merged.json',
    })

    file[target] = items

    cb(null, file)
  })
}
