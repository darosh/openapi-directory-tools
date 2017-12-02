import { getLeadsAsync } from './sources'
import { getOrigin } from './utils'

const {log, colors} = require('gulp-util')
const toPairs = require('lodash/toPairs')
const cloneDeep = require('lodash/cloneDeep')

export function loadLeadsAsync (specs, blacklist) {
  return getLeadsAsync(specs, blacklist)
    .then(leads => toPairs(leads))
    .then(pairs => pairs.map(([filename, lead]) => {
      if (!lead) {
        return
      }

      let origin = cloneDeep(getOrigin(lead))

      if (Array.isArray(origin)) {
        origin = origin.pop()
      }

      if (origin['x-apisguru-direct']) {
        const source = origin.url
        log(colors.cyan('skip'), source)
        return null
      }

      return [filename, lead]
    }).filter(d => d && d[1]))
}
