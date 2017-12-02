import { stringify } from '../lib/stringify'

const {obj} = require('through2')
const {log, colors, PluginError} = require('gulp-util')
const glog = require('gulplog')
const {dirname} = require('path')

const PLUGIN_NAME = 'json'

export function json (field = 'json', serialize = true) {
  const {load} = require('js-yaml')

  return obj(function (file, enc, cb) {
    glog.debug(PLUGIN_NAME, colors.grey(dirname(file.relative)))

    file.yaml = file.contents

    try {
      file[field] = load(file.contents)

      if (serialize) {
        file.contents = Buffer.from(stringify(file.json))
      }
    } catch (err) {
      log(PLUGIN_NAME, colors.red(file.relative))
      return cb(new PluginError(PLUGIN_NAME, err.toString(), {fileName: file.path}))
    }

    cb(null, file)
  })
}
