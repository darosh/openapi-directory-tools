import { newPatch } from '../lib/spec'

const {File, log, colors} = require('gulp-util')

export function patch (base) {
  return function (file) {
    if (file.validation && file.validation.errors) {
      return
    }

    const _this = this

    return newPatch(file, base).then(add => {
      if (add) {
        log('new patch', colors.cyan(file.patchFile))

        _this.push(new File({
          contents: Buffer.from(file.patch),
          path: file.patchFile
        }))
      }
    })
  }
}
