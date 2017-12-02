const pick = require('lodash/pick')

const fields = [
  'version',
  'x-providerName',
  'x-serviceName',
  'x-logo',
  'x-origin'
]

export function getSimpleInfo (field) {
  return function (obj) {
    return pick(obj[field].info, fields)
  }
}
