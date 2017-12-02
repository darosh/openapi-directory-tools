const {obj} = require('through2-concurrent')
const {exec} = require('child_process')
const {log, colors, PluginError} = require('gulp-util')
const {dirname} = require('path')

const PLUGIN_NAME = 'git'

export function git () {
  return obj({
    maxConcurrency: 8
  }, function (file, enc, cb) {
    const cmd = `git log --format=%aD --follow -- ${file.path}`
    exec(cmd, {cwd: process.cwd()}, (err, stdout) => {
      if (err) {
        return cb(new PluginError(PLUGIN_NAME, err))
      }

      let dates = stdout.split('\n').filter(d => d)
      dates = dates.length ? dates : [new Date()]
      file.dates = [dates[0], dates[dates.length - 1]].map(d => new Date(d))

      log(PLUGIN_NAME, colors.grey(dirname(file.relative)),
        '(' + colors.magenta(file.dates[0].toISOString().split('T')[0]),
        (file.dates[0] !== file.dates[1] ? '- ' + colors.magenta(file.dates[1].toISOString().split('T')[0]) : '') + ')'
      )
      cb(null, file)
    })
  })
}
