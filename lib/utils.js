const assert = require('assert')
const isUndefined = require('lodash/isUndefined')
const isEmpty = require('lodash/isEmpty')
const sanitize = require('sanitize-filename')
const {readFile} = require('fs')
const {dirname, join} = require('path')

export function getServiceName (swagger) {
  return swagger.info['x-serviceName']
}

export function getInfoServiceName (swaggerInfo) {
  return swaggerInfo['x-serviceName']
}

export function getApiId (swagger) {
  let id = getProviderName(swagger)

  assert(id.indexOf(':') === -1)

  const service = getServiceName(swagger)

  if (!isUndefined(service)) {
    assert(service.indexOf(':') === -1)
    id += ':' + service
  }

  return id
}

export function getProviderName (swagger) {
  assert(swagger.info['x-providerName'])

  return swagger.info['x-providerName']
}

export function getInfoProviderName (swaggerInfo) {
  assert(swaggerInfo['x-providerName'])

  return swaggerInfo['x-providerName']
}

export function getOrigin (swagger) {
  return swagger.info['x-origin']
}

export function getOriginUrl (swagger) {
  const o = getOrigin(swagger)
  return o[o.length - 1].url
}

export function getSwaggerPath (swagger, filename) {
  filename = filename || 'swagger.yaml'
  return getPathComponents(swagger).join('/') + '/' + filename
}

export function getSwaggerInfoPath (swaggerInfo, filename) {
  filename = filename || 'swagger.yaml'
  return getInfoPathComponents(swaggerInfo).join('/') + '/' + filename
}

export function getInfoPathComponents (swaggerInfo, stripVersion) {
  const serviceName = getInfoServiceName(swaggerInfo)
  let path = [getInfoProviderName(swaggerInfo)]

  if (serviceName) {
    path.push(serviceName)
  }

  if (!stripVersion) {
    let version = swaggerInfo.version || '1.0.0'
    version = version.split(' (')[0]
    path.push(version)
  }

  path = path.map(function (str) {
    str = sanitize(str)
    assert(!isEmpty(str))
    return str
  })

  return path
}


export function getPathComponents (swagger, stripVersion) {
  const serviceName = getServiceName(swagger)
  let path = [getProviderName(swagger)]

  if (serviceName) {
    path.push(serviceName)
  }

  if (!stripVersion) {
    let version = swagger.info.version || '1.0.0'
    version = version.split(' (')[0]
    path.push(version)
  }

  path = path.map(function (str) {
    str = sanitize(str)
    assert(!isEmpty(str))
    return str
  })

  return path
}

export function readYamlAsync (filename) {
  const {safeLoad} = require('js-yaml')

  return new Promise((resolve) => {
    readFile(filename, 'utf-8', (err, data) => {
      if (err) {
        resolve()
      } else {
        resolve(safeLoad(data))
      }
    })
  })
}

export function fixupFile (swaggerPath) {
  return join(dirname(swaggerPath), 'fixup.yaml')
}
