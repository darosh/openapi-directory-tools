const pretty = require('json-stringify-pretty-compact')

const _compact = (json) => (pretty(json, {maxLength: 120}))
const _simple = (json) => (JSON.stringify(json, null, 2))

let _stringify = _compact

export function stringify (json) {
  return _stringify(json)
}

export function setCompact (value) {
  if (value) {
    _stringify = _compact
  } else {
    _stringify = _simple
  }
}
