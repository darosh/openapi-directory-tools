const {join} = require('path')
const {existsSync} = require('fs')

let file = './gulpfile.tasks.js'

if (!existsSync(join(__dirname, file))) {
  require = require('@std/esm')(module, true) // eslint-disable-line no-global-assign
  file = './gulpfile.tasks.mjs'
}

require(file)
