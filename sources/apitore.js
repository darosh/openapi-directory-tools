import { getCache } from '../lib/cache'
import got from '../lib/got'

export function apitore () {
  return got('https://api.apitore.com/json/0', {json: true, cache: getCache()})
    .then(res => Object.keys(res.body).map(api => {
      const components = api.split('/')
      const apiNumber = components[components.length - 1]
      const entry = res.body[api]

      return {
        'version': entry.version,
        'x-providerName': 'apitore.com',
        'x-serviceName': toCamelCase(entry.title.split('(').join('_').split(')').join('_')),
        'x-logo': {
          'url': 'https://apitore.com/img/apis/' + apiNumber + '.jpg'
        },
        'x-origin': [{
          url: api,
          format: 'swagger',
          version: '2.0'
        }]
      }
    }))
}

apitore.provider = 'apitore.com'

function toCamelCase (text) {
  return text.toLowerCase().replace(/[-_ /.](.)/g, function (match, group1) {
    return group1.toUpperCase()
  })
}
