import { loadLeadsAsync } from '../lib/loadLeadsAsync'

const {log, colors, File, PluginError} = require('gulp-util')
const glog = require('gulplog')
const {obj} = require('through2')

const PLUGIN_NAME = 'leads'

export function leads (blacklist) {
  const specs = {}

  return obj(function (file, enc, cb) {
    glog.debug(PLUGIN_NAME, `${colors.yellow(file.relative)}`)
    specs[file.relative.replace(/\\/g, '/')] = file.json
    cb()
  }, function (cb) {
    log(`loaded ${colors.magenta(Object.keys(specs).length)} specs`)

    loadLeadsAsync(specs, blacklist)
      .then(leads => {
        log(`parsed ${colors.magenta(leads.length)} leads`)

        leads.forEach(([path, lead]) => {
          const f = new File({path})
          f.lead = lead
          this.push(f)
        })

        cb()
      })
      .catch(error => cb(new PluginError(PLUGIN_NAME, error.message, {error})))
  })
}
