import { readYamlAsync } from '../utils'

const {join} = require('path')
const {promisify} = require('util')
const {readdir} = require('fs')
const readdirAsync = promisify(readdir)

export function addFixes (fixesPath) {
  const fixes = readdirAsync(fixesPath).catch(() => [])

  return function (ctx) {
    return new Promise((resolve) => {
      const fixFile = encodeURIComponent(ctx.source) + '.yaml'
      const fixPath = join(fixesPath, fixFile)

      return fixes.then(files => {
        if (files.indexOf(fixFile) > -1) {
          readYamlAsync(fixPath).then(fixup => {
            ctx.fixup = fixup
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  }
}
