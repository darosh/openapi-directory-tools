import { getCache } from '../lib/cache'
import got from '../lib/got'

export function swaggerhub () {
  const base = 'https://api.swaggerhub.com/apis/swagger-hub/registry-api'
  return got(base, {json: true, cache: getCache()})
    .then(({body}) => {
      const version = body.apis.reverse()
        .find(a => a.properties.filter(e => (e.type === 'X-Published') && (e.value === 'true')))
        .properties.find(e => e.type === 'X-Version').value

      return [{
        'x-providerName': 'swaggerhub.com',
        'x-origin': [{
          url: base + '/' + version,
          format: 'swagger',
          version: '2.0'
        }]
      }]
    })
}

swaggerhub.provider = 'swaggerhub.com'
