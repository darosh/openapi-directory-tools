const {File} = require('gulp-util')
const {obj} = require('through2')

export function empty (o) {
  const pass = obj(
    (file, enc, cb) => {
      cb()
    },
    (cb) => {
      cb(null, o ? Object.assign(new File(o), o) : null)
    })
  process.nextTick(pass.end.bind(pass))
  return pass
}
