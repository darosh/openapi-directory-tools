import got from './got'
import { getCache } from './cache'

let converter

export function getSpec (source, format, callback) {
  return getConverter().getSpec(source, format, callback)
}

export function getFormatName (name, version) {
  return getConverter().getFormatName(name, version)
}

export function converterVersion () {
  return require('api-spec-converter/package.json').version
}

function getConverter () {
  if (converter) {
    return converter
  }

  converter = require('api-spec-converter')
  converter.ResourceReaders.url = function (url) {
    const Promise = require('bluebird')
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

    return new Promise((resolve, reject) => got(url, {
      headers: {
        'Accept': 'application/json,*/*',
        'if-modified-since': null
      },
      retries: 2,
      json: false,
      cache: getCache()
    })
      .then(({body}) => {
        resolve(body)
      })
      .catch((err) => {
        reject(err)
      }))
  }

  return converter
}
