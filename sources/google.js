import { getCache } from '../lib/cache'
import got from '../lib/got'

export function google () {
  return got('https://www.googleapis.com/discovery/v1/apis', {json: true, cache: getCache()})
    .then(({body}) => body.items.map((value) => ({
      version: value.version,
      'x-providerName': 'googleapis.com',
      'x-serviceName': value.name,
      'x-preferred': value.preferred,
      'x-origin': [{
        url: value.discoveryRestUrl,
        format: 'google',
        version: 'v1'
      }]
    })))
}

google.provider = 'googleapis.com'
