import { sortJson } from '../lib/index'

const {obj} = require('through2')
const {colors} = require('gulp-util')
const glog = require('gulplog')

const PLUGIN_NAME = 'yaml'

export function yaml (field) {
  const {safeDump} = require('js-yaml')

  return obj(function (file, enc, cb) {
    if (field && file[field]) {
      file.contents = Buffer.from(safeDump(sortJson(file[field]), {lineWidth: -1}))
    } else if (file.yaml) {
      file.contents = file.yaml
    } else if (file.json) {
      file.contents = Buffer.from(safeDump(sortJson(file.json), {lineWidth: -1}))
    } else {
      file.contents = null
    }

    if (file.contents != null) {
      glog.debug(PLUGIN_NAME, colors.grey(file.relative))
    } else {
      glog.warn(PLUGIN_NAME, colors.yellow('skipping empty'), colors.grey(file.relative))
    }

    cb(null, file)
  })
}
