import { getSource } from '../lib/spec/getMeta'
import { postValidation } from '../lib/spec'
import { runValidate, validatePreferred } from '../lib/spec/runValidateAndFix'

const {obj} = require('through2')
const {obj: objConcurent} = require('through2-concurrent')
const {log, colors} = require('gulp-util')
const glog = require('gulplog')
const {cpus} = require('os')
const {createHash} = require('crypto')
const {join, dirname} = require('path')
const mkdirp = require('mkdirp')
const {readFile, writeFile} = require('fs')

const PLUGIN_NAME = 'validate'

export function validate (cache) {
  return objConcurent({
    maxConcurrency: cpus().length * 2
  }, function (file, enc, cb) {
    file.swagger = file.json
    file.source = getSource(file.swagger)

    const hash = createHash('md4')
    hash.update(file.yaml)
    const cached = `${join(cache, file.relative)}.${hash.digest('hex')}`

    mkdirp(dirname(cached), () => {
      readFile(cached, 'utf8', run)
    })

    function run (err, result) {
      if (err) {
        runValidate(file).then(() => {
          postValidation(file)
          logResults(file)
          writeFile(cached, JSON.stringify(file.validation), () => {
            cb(null, file)
          })
        })
      } else {
        try {
          file.validation = JSON.parse(result)
          postValidation(file)
        } catch (ign) {
          run(true)
        }

        logResults(file)
        cb(null, file)
      }
    }
  })
}

export function preferred () {
  const specs = []

  return obj(function (file, enc, cb) {
    specs.push(file.json)
    cb()
  }, function (cb) {
    validatePreferred(specs)
    log(PLUGIN_NAME, `${colors.cyan('preferred')}`, specs.length)
    cb()
  })
}

function logResults (file) {
  if (!file.validation) {
    return glog.error(PLUGIN_NAME, colors.red('missing'), `${colors.grey(dirname(file.relative))}`)
  }

  let msg = []
  let type = null

  if (file.validation.errors) {
    type = 'error'
    msg.push(`${colors.red('errors')} ${colors.bold(file.validation.errors.length)}`)
  }

  if (file.validation.warnings) {
    type = type || 'warn'
    msg.push(`${colors.yellow('warnings')} ${colors.bold(file.validation.warnings.length)}`)
  }

  if (file.validation.info) {
    type = type || 'info'
    msg.push(`${colors.cyan('info')} ${colors.bold(file.validation.info.length)}`)
  }

  if (!msg.length) {
    msg.push(`${colors.green('OK')}`)
  }

  type = type || 'debug'
  glog[type](PLUGIN_NAME, msg.join(', '), `${dirname(file.relative)}`)
}
