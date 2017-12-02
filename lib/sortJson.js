const sortObject = require('deep-sort-object')
const isUndefined = require('lodash/isUndefined')

export function sortJson (json) {
  if (!json) {
    return json
  }

  json = sortObject(json, function (a, b) {
    if (a === b) { return 0 }
    return (a < b) ? -1 : 1
  })

  // detect Swagger format.
  if (json.swagger !== '2.0') {
    return json
  }

  const fieldOrder = [
    'swagger',
    'schemes',
    'host',
    'basePath',
    'x-hasEquivalentPaths',
    'info',
    'externalDocs',
    'consumes',
    'produces',
    'securityDefinitions',
    'security',
    'parameters',
    'responses',
    'tags',
    'paths',
    'definitions'
  ]

  const sorted = {}

  fieldOrder.forEach(function (name) {
    if (isUndefined(json[name])) {
      return
    }

    sorted[name] = json[name]
    delete json[name]
  })

  Object.assign(sorted, json)

  return sorted
}
