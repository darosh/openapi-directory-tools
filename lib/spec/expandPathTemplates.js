const SwaggerMethods = require('swagger-methods')
const assert = require('assert')
const some = require('lodash/some')
const isUndefined = require('lodash/isUndefined')
const cloneDeep = require('lodash/cloneDeep')
const pick = require('lodash/pick')
const each = require('lodash/each')

export function expandPathTemplates ({swagger}) {
  const paths = swagger.paths
  Object.keys(paths).forEach(function (path) {
    function applyParameter (pathItem, name, callback) {
      function applyParameterArray (paramArray, callback) {
        const newParamArray = []
        some(paramArray, function (param) {
          if (param.name !== name) {
            newParamArray.push(param)
            return
          }

          assert(param.in === 'path')
          const ret = callback(param)

          if (!isUndefined(ret)) { newParamArray.push(ret) }
        })

        return newParamArray
      }

      pathItem.parameters = applyParameterArray(pathItem.parameters, callback)
      each(pick(pathItem, SwaggerMethods), function (value) {
        value.parameters = applyParameterArray(value.parameters, callback)
      })
    }

    const pathItem = paths[path]
    const originalPath = path
    let match

    while ((match = /{\+([^}]*?)}/.exec(path))) {
      const paramName = match[1]
      path = path.replace(match[0], '{' + paramName + '}')
      applyParameter(pathItem, paramName, function (param) {
        param['x-reservedExpansion'] = true
        return param
      })
    }

    const parameterNames = []

    while ((match = /{\/([^}]*?)}/.exec(path))) {
      const paramName = match[1]
      path = path.replace(match[0], '/{' + paramName + '}')
      applyParameter(pathItem, paramName, function (param) {
        assert(isUndefined(param.required) || param.required === false)
        param.required = true
        return param
      })
      parameterNames.unshift(paramName)
    }

    let clonePath = path
    const clonePathItem = cloneDeep(pathItem)

    parameterNames.forEach(function (paramName) {
      clonePath = clonePath.replace('/{' + paramName + '}', '')
      applyParameter(clonePathItem, paramName, function () {
        // delete it
      })
      paths[clonePath] = cloneDeep(clonePathItem)
    })

    delete paths[originalPath]
    paths[path] = pathItem
  })
}
