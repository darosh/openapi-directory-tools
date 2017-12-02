import { sortJson } from '../lib/sortJson'
import { stringify } from '../lib/stringify'

const {obj} = require('through2')
const {dirname} = require('path')
const {File, log, colors} = require('gulp-util')

const PLUGIN_NAME = 'api'

export function api (logoUrl) {
  return obj(function (file, enc, cb) {
    const swagger = file.json

    delete file.yaml
    swagger.info['x-preferred'] = swagger.info['x-preferred'] === false ? swagger.info['x-preferred'] : true

    if (file.logo) {
      swagger.info['x-logo'].url = logoUrl + file.logo
    }

    cb(null, file)
  })
}

export function apis (rootUrl, apisFile, metricsFile) {
  const json = {}
  const metrics = {
    numSpecs: 0,
    numAPIs: 0,
    numEndpoints: 0
  }

  return obj(function (file, enc, cb) {
    log(PLUGIN_NAME, `${colors.cyan(dirname(file.relative))}`)
    const swagger = file.json
    const id = swagger.info['x-providerName'] + (swagger.info['x-serviceName'] ? ':' + swagger.info['x-serviceName'] : '')

    json[id] = json[id] || {versions: {}, added: file.dates ? file.dates[1] : undefined}

    if (swagger.info['x-preferred']) {
      json[id].preferred = swagger.info.version
    }

    // FIXME: here we don't track deleted version, not a problem for right now :)
    if (file.dates) {
      json[id].added = file.dates[1] < json[id].added ? file.dates[1] : json[id].added
    }

    json[id].versions[swagger.info.version] = {
      swaggerUrl: rootUrl + file.relative.replace(/\\/g, '/').replace(/\.yaml$/, '.json'),
      swaggerYamlUrl: rootUrl + file.relative.replace(/\\/g, '/'),
      info: swagger.info,
      externalDocs: swagger.externalDocs,
      added: file.dates ? file.dates[1] : undefined,
      updated: file.dates ? file.dates[0] : undefined
    }

    metrics.numSpecs++
    metrics.numEndpoints += Object.keys(swagger.paths).length

    cb()
  }, function (cb) {
    this.push(new File({
      path: apisFile,
      contents: Buffer.from(stringify(sortJson(json)))
    }))

    metrics.numAPIs = Object.keys(json).length

    this.push(new File({
      path: metricsFile,
      contents: Buffer.from(stringify(metrics))
    }))

    log(PLUGIN_NAME, `Generated list for ${colors.magenta(metrics.numSpecs)} specs`)

    cb()
  })
}
