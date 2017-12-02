import { stringify } from '../lib/stringify'

const {colors} = require('gulp-util')
const glog = require('gulplog')
const {obj} = require('through2')
const objConcurent = require('through2-concurrent').obj
const serialize = require('serialize-error')

export function transform (fnc, field = null, maxConcurrency = 1) {
  if (typeof fnc === 'string') {
    field = fnc
    fnc = null
  }

  return maxConcurrency === 1 ? obj(run) : objConcurent({maxConcurrency}, run)

  function run (file, enc, cb) {
    let then

    if (fnc && !file.fatal) {
      try {
        then = fnc.call(this, file)
      } catch (error) {
        return failed(file, error, enc, cb)
      }
    }

    if (then && then.then) {
      then
        .then(() => done(file, enc, cb))
        .catch(error => failed(file, error, enc, cb))
    } else {
      done(file, enc, cb)
    }
  }

  function done (file, enc, cb) {
    if (field) {
      const f = getField(file, field)
      file.contents = f ? Buffer.from(stringify(f)) : null
    }

    cb(null, file)
  }

  function failed (file, error, enc, cb) {
    if (!file.fatal) {
      glog.error(`[${colors.red('error')}]`, colors.red(error.message), file.relative)
    }

    file.fatal = file.fatal || []

    try {
      file.fatal.push(serialize(error))
    } catch (ign) {
      file.fatal.push([error.message, error.originalStackDescriptor ? serialize(error.originalStackDescriptor) : null])
    }

    done(file, enc, cb)
  }
}

function getField (obj, field) {
  if (!field.includes('.')) {
    return obj[field]
  } else {
    const p = field.split('.')
    let f

    while (obj && (f = p.shift())) {
      obj = obj[f]
    }

    return obj
  }
}
