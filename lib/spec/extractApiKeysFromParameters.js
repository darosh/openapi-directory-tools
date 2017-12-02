const SwaggerMethods = require('swagger-methods')
const some = require('lodash/some')
const each = require('lodash/each')
const size = require('lodash/size')
const filter = require('lodash/filter')
const remove = require('lodash/remove')
const pick = require('lodash/pick')
const uniq = require('lodash/uniq')
const map = require('lodash/map')
const sortBy = require('lodash/sortBy')
const last = require('lodash/last')

export function extractApiKeysFromParameters ({swagger}) {
  if (swagger.securityDefinitions || swagger.security) { return }

  function isApiKeyParam (param) {
    return some(
      [
        /^user[-_]?key$/i,
        /^api[-_]?key$/i,
        /^access[-_]?key$/i
      ],
      function (regExp) {
        return regExp.test(param.name)
      }
    )
  }

  let inAllMethods = true
  const apiKeys = []

  each(swagger.paths, function (path) {
    each(map(pick(path, SwaggerMethods), 'parameters'), function (params) {
      const apiKey = filter(params, isApiKeyParam)

      if (size(apiKey) === 1) { apiKeys.push(apiKey[0]) } else { inAllMethods = false }
    })
  })

  if (!inAllMethods) {
    return
  }

  let paramName = uniq(map(apiKeys, 'name'))

  if (size(paramName) !== 1) {
    return
  }

  paramName = paramName[0]

  let paramIn = uniq(map(apiKeys, 'in'))

  if (size(paramIn) !== 1) {
    return
  }

  paramIn = paramIn[0]

  if (['header', 'query'].indexOf(paramIn) === -1) {
    return
  }

  // Ignore duplicates, and choose longest description.
  const paramDescription = last(sortBy(uniq(map(apiKeys, 'description')), size))

  swagger.securityDefinitions = {}
  swagger.securityDefinitions[paramName] = {
    type: 'apiKey',
    name: paramName,
    in: paramIn,
    description: paramDescription
  }

  swagger.security = [{}]
  swagger.security[0][paramName] = []

  each(swagger.paths, function (path) {
    each(map(pick(path, SwaggerMethods), 'parameters'), function (parameters) {
      remove(parameters, function (param) {
        return param.name === paramName && param.in === paramIn
      })
    })
  })
}
