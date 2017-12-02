import { replaceSpaces } from './utils'

const isUndefined = require('lodash/isUndefined')
const mapKeys = require('lodash/mapKeys')

export function replaceSpacesInSchemaNames ({swagger}) {
  if (isUndefined(swagger.definitions)) {
    return
  }

  swagger.definitions = mapKeys(swagger.definitions, function (value, key) {
    return replaceSpaces(key)
  })
}
