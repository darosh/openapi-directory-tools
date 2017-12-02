import { jsondiffpatch } from './utils'

const {readFileSync, readFile} = require('fs')
const {dirname, join} = require('path')
const {log, colors} = require('gulp-util')
const glog = require('gulplog')

export function getFixup (fixupFileName, originalYaml, editedYaml) {
  const {safeLoad, dump} = require('js-yaml')
  const isEqual = require('lodash/isEqual')

  const original = safeLoad(originalYaml)
  const edited = safeLoad(editedYaml)

  if (isEqual(original, edited)) {
    return ''
  }

  let fixup

  try {
    const fixupYaml = readFileSync(fixupFileName, 'utf8')
    fixup = safeLoad(fixupYaml)
  } catch (ign) {}

  if (fixup) {
    jsondiffpatch.unpatch(original, fixup)
  }

  const diff = jsondiffpatch.diff(original, edited)

  return dump(diff)
}

export function refreshFixup (ctx) {
  const {safeLoad, dump} = require('js-yaml')

  return new Promise((resolve, reject) => {
    const swaggerFileName = join(dirname(ctx.path), 'swagger.yaml')
    readFile(swaggerFileName, 'utf8', (err, swaggerYaml) => {
      if (err) {
        glog.error(colors.red('missing'), ctx.relative)
        resolve()
      } else {
        const original = safeLoad(swaggerYaml)
        const reverted = safeLoad(swaggerYaml)
        const fixupYaml = ctx.contents.toString()
        const fixup = safeLoad(fixupYaml)
        jsondiffpatch.unpatch(reverted, fixup)
        const diff = jsondiffpatch.diff(reverted, original)
        const diffYaml = dump(diff)

        if (fixupYaml !== diffYaml) {
          ctx.contents = Buffer.from(diffYaml)
          log(colors.magenta('updating'), ctx.relative)
        } else {
          log(colors.cyan('skipping'), ctx.relative)
        }

        resolve()
      }
    })
  })
}
