import { converterVersion } from '../converter'

const assert = require('assert')
const parseDomain = require('parse-domain')
const merge = require('lodash/merge')
const isEqual = require('lodash/isEqual')
const last = require('lodash/last')

export function convertToSwagger (ctx) {
  const spec = ctx.spec

  return spec.convertTo('swagger_2')
    .then(swagger => {
      merge(swagger.spec.info, {
        'x-providerName': parseHost(swagger.spec, spec.source)
      })

      if (typeof swagger.spec.info['x-origin'] === 'undefined') {
        swagger.spec.info['x-origin'] = []
      }

      if (!Array.isArray(swagger.spec.info['x-origin'])) {
        swagger.spec.info['x-origin'] = [swagger.spec.info['x-origin']]
      }

      const newOrigin = {
        format: spec.formatName,
        version: spec.getFormatVersion(),
        url: spec.source
      }

      if ((newOrigin.format !== 'swagger') || (newOrigin.version !== '2.0')) {
        newOrigin.converter = {
          url: 'https://github.com/lucybot/api-spec-converter',
          version: converterVersion()
        }
      }

      if (!isEqual(last(swagger.spec.info['x-origin']), newOrigin)) { swagger.spec.info['x-origin'].push(newOrigin) }

      ctx.swagger = swagger.spec
      return ctx
    })
}

function parseHost (swagger, altSource) {
  const swHost = swagger.host

  assert(swHost, 'Missing host')
  assert(!/^localhost/.test(swHost), 'Can not add localhost API')
  assert(swHost !== 'raw.githubusercontent.com', 'Missing host + spec hosted on GitHub')
  assert(swHost !== 'virtserver.swaggerhub.com', 'Cannot add swaggerhub mock server API')
  assert(swHost !== 'example.com', 'Cannot add example.com API')

  let p = parseDomain(swHost)

  if (!p) {
    p = parseDomain(altSource)
  }

  p.domain = p.domain.replace(/^www.?/, '')
  p.subdomain = p.subdomain.replace(/^www.?/, '')

  // TODO: use subdomain to detect 'x-serviceName'

  let host = p.tld

  if (p.domain !== '') {
    host = p.domain + '.' + host
  }

  // Workaround for google API
  if (p.tld === 'googleapis.com') {
    host = p.tld
  }

  assert(host && host !== '')

  return host
}
