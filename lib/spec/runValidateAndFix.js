import { getSpec } from '../converter'
import { replaceSpaces } from './utils'
import { getApiId } from '../utils'

const assert = require('assert')
const jsonPath = require('jsonpath')
const jp = require('json-pointer')

const isEmpty = require('lodash/isEmpty')
const isUndefined = require('lodash/isUndefined')
const isBoolean = require('lodash/isBoolean')
const isString = require('lodash/isString')
const remove = require('lodash/remove')
const dropRight = require('lodash/dropRight')
const clone = require('lodash/clone')
const filter = require('lodash/filter')
const includes = require('lodash/includes')
const nth = require('lodash/nth')
const last = require('lodash/last')
const each = require('lodash/each')

export function runValidateAndFix (ctx) {
  return validateAndFix(ctx.swagger, ctx.source)
    .then(validation => (ctx.validation = validation))
}

export function runValidate (ctx) {
  assert(!isEmpty(ctx.swagger.paths), 'Definition should have operations')

  // FIXME: we can't do this check yet because of Amazon AWS and some others
  // _.each(swagger.paths, function (path, key) {
  //  assert(key.indexOf('?') === -1, 'Path contains hard-coded query parameters');
  // });

  // FIXME: check location
  // assert(util.getSwaggerPath(swagger) === filename, 'Incorect location');

  return validateSwagger(ctx.swagger, ctx.source)
    .then(validation => (ctx.validation = validation))
}

function validateAndFix (swagger, source) {
  return validateSwagger(swagger, source)
    .then(result => {
      if (!result.errors) { return result }

      // FIXME Too recursive
      // if (fixSpec(swagger, result.errors)) {
      //   return validateAndFix(swagger, source)
      // } else {
      //   return validateSwagger(swagger, source)
      // }

      fixSpec(swagger, result.errors)
      return validateSwagger(swagger, source)
    })
}

function validateSwagger (swagger, source) {
  const safeLoad = require('js-yaml')

  return getSpec(swagger, 'swagger_2')
    .then(function (spec) {
      let relativeBase = source.split('/')

      relativeBase.pop()
      relativeBase = relativeBase.join('/')

      spec.jsonRefs = {
        relativeBase: relativeBase,
        loaderOptions: {
          processContent: function (res, cb) {
            // TODO Who calls this?
            cb(null, safeLoad(res.text, {json: true}))
          }
        }
      }

      return spec
    })
    .then(spec => spec.validate())
    .then(result => {
      if (result.errors && swagger['x-hasEquivalentPaths']) {
        remove(result.errors, function (error) {
          return (error.code === 'EQUIVALENT_PATH')
        })

        if (isEmpty(result.errors)) { result.errors = null }
      }

      return result
    })
}

function fixSpec (swagger, errors) {
  let fixed = false

  errors.forEach(function (error) {
    const path = error.path
    let value
    let parentValue

    try {
      parentValue = jp.get(swagger, dropRight(path))
      value = jp.get(swagger, path)
    } catch (e) {
      // FIXME: sway give path with intermediate $refs in them
      return
    }

    let newValue

    switch (error.code) {
      case 'EQUIVALENT_PATH':
        swagger['x-hasEquivalentPaths'] = true
        break
      case 'MISSING_PATH_PARAMETER_DECLARATION':
        // TODO: add warning
        jp.remove(swagger, path)
        return true
      case 'MISSING_PATH_PARAMETER_DEFINITION':
        const field = error.message.match(/: (.+)$/)[1]
        newValue = clone(value)
        newValue.parameters = value.parameters || []
        newValue.parameters.push({
          name: field,
          type: 'string',
          in: 'path',
          required: true
        })
        break
      case 'OBJECT_MISSING_REQUIRED_PROPERTY_DEFINITION':
        if (isUndefined(value.properties)) { break }

        newValue = clone(value)
        newValue.required = [];

        (value.required || []).forEach(function (name) {
          if (!isUndefined(value.properties[name])) {
            newValue.required.push(name)
          }
        })

        if (isEmpty(newValue.required)) {
          delete newValue.required
        }
        break
      case 'ONE_OF_MISSING':
        if (value.in === 'path' && !value.required) {
          newValue = clone(value)
          newValue.required = true
        }
        break
      case 'UNRESOLVABLE_REFERENCE':
        if (value.indexOf(' ') !== -1) {
          newValue = value = replaceSpaces(value)
        }

        if (typeof swagger.definitions[value] !== 'undefined') {
          newValue = '#/definitions/' + value
        }
        break
      case 'DUPLICATE_OPERATIONID':
        // FIXME: find better solution than to strip all duplicate 'operationId'
        let operationIds = jsonPath.query(swagger, '$.paths[*][*].operationId')

        operationIds = filter(operationIds, function (value, index, iteratee) {
          return includes(iteratee, value, index + 1)
        })

        jsonPath.apply(swagger, '$.paths[*][*].operationId', function (value) {
          if (operationIds.find(function (e) {
              return e === value
            })) return undefined
          else return value
        })
        fixed = true

        break
      case 'OBJECT_MISSING_REQUIRED_PROPERTY':
        if (error.message === 'Missing required property: version') {
          newValue = clone(value)
          newValue.version = '1.0.0'
          break
        }
        if (value.type === 'array' && isUndefined(value.items)) {
          newValue = clone(value)
          newValue.items = {}
        }
        break
      case 'INVALID_TYPE':
        if (nth(path, -1) === 'required' && nth(path, -3) === 'properties' &&
          error.message === 'Expected type array but found type boolean') {
          const objectSchema = jp.get(swagger, dropRight(path, 3))

          if (value) {
            objectSchema.required = objectSchema.required || []
            const propertyName = nth(path, -2)
            if (objectSchema.required.indexOf(propertyName) === -1) { objectSchema.required.push(propertyName) }
          }

          delete parentValue.required
          fixed = true
          break
        }

        const match = error.message.match(/^Expected type (\w+) but found type (\w+)$/)

        if (match && match[2] === 'string') {
          try {
            const tmp = JSON.parse(value)

            // eslint-disable-next-line valid-typeof
            if (typeof tmp === match[1]) {
              newValue = tmp
              break
            }
          } catch (e) {}
        }
      // eslint-disable-next-line no-fallthrough
      case 'ENUM_MISMATCH':
      case 'INVALID_FORMAT':
        if (last(error.path) === 'default') {
          const type = parentValue.type

          if (isString(value) && !isUndefined(type) && type !== 'string') {
            try {
              newValue = JSON.parse(value)
            } catch (e) {}
          }

          delete parentValue.default
          // TODO: add warning
          break
        }
    }

    if (!isUndefined(newValue)) {
      jp.set(swagger, path, newValue)
      fixed = true
    }
  })

  return fixed
}

export function validatePreferred (specs) {
  const preferred = {}

  specs.forEach(function (swagger) {
    const id = getApiId(swagger)
    preferred[id] = preferred[id] || {}
    preferred[id][swagger.info.version] = swagger.info['x-preferred']
    assert(Object.keys(swagger.paths).length > 0, `"${id}" has no paths`)
  })

  Object.keys(preferred).forEach(function (id) {
    let versions = preferred[id]

    if (Object.keys(versions).length === 1) {
      versions = Object.keys(versions).map(k => versions[k])
      assert(isUndefined(versions[0]) || versions[0] === true, 'Preferred not true in "' + id + '"')
      return
    }

    let seenTrue = false

    each(versions, function (value, version) {
      assert(!isUndefined(value), `Missing value for "x-preferred" in "${id}" "${version}"`)
      assert(isBoolean(value), `Non boolean value for "x-preferred" in "${id}" "${version}"`)
      assert(value !== true || !seenTrue, `Multiple preferred versions in "${id}" "${version}"`)
      seenTrue = value || seenTrue
    })

    assert(seenTrue, `At least one preferred should be true in "${id}"`)
  })
}
