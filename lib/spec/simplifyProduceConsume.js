const SwaggerMethods = require('swagger-methods')

const each = require('lodash/each')
const isEqual = require('lodash/isEqual')
const isUndefined = require('lodash/isUndefined')
const map = require('lodash/map')
const pick = require('lodash/pick')
const flatten = require('lodash/flatten')
const values = require('lodash/values')

export function simplifyProduceConsume ({swagger}) {
  const operations = flatten(map(values(swagger.paths), path => values(pick(path, SwaggerMethods))))

  let globalProduces = swagger.produces
  let globalConsumes = swagger.consumes

  each(operations, function (op) {
    if (isUndefined(globalProduces)) {
      globalProduces = op.produces
    }

    if (isUndefined(globalConsumes)) {
      globalConsumes = op.consumes
    }

    if (!isEqual(globalProduces || null, op.produces)) {
      globalProduces = null
    }

    if (!isEqual(globalConsumes || null, op.consumes)) {
      globalConsumes = null
    }
  })

  if (Array.isArray(globalProduces)) {
    swagger.produces = globalProduces
  }

  if (Array.isArray(globalConsumes)) {
    swagger.consumes = globalConsumes
  }

  each(operations, function (op) {
    if (isEqual(swagger.produces, op.produces)) {
      delete op.produces
    }

    if (isEqual(swagger.consumes, op.consumes)) {
      delete op.consumes
    }
  })
}
