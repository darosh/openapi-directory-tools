const {readFileSync} = require('fs')
const editor = require('editor')

export function editFile (path, opt) {
  return new Promise((resolve, reject) => {
    editor(path, opt, function (code) {
      if (code !== 0) {
        reject(new Error(`Editor closed with code ${code}.`))
      } else {
        resolve(readFileSync(path, 'utf8'))
      }
    })
  })
}
