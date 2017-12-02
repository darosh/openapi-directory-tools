const {PluginError, log, colors} = require('gulp-util')

const PLUGIN_NAME = 'online'

export function online () {
  return function (cb) {
    const isOnline = require('is-online')

    log(PLUGIN_NAME, '\u2026?')
    isOnline().then(online => {
      if (online) {
        log(PLUGIN_NAME, colors.green('OK'))
        cb()
      } else {
        cb(new PluginError(PLUGIN_NAME, 'Offline\u2026 :-('))
      }
    })
  }
}
