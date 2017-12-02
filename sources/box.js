import { listGitHubFilesAsync, rawGitHubUrl } from '../lib/github'

export function box () {
  return listGitHubFilesAsync('box', 'box-openapi', '**/*.json')
    .then(files => files.map(filename => ({
      'x-providerName': 'box.com',
      'x-serviceName': serviceName(filename),
      'x-origin': [{
        url: rawGitHubUrl('box', 'box-openapi', filename),
        format: 'swagger',
        version: '2.0'
      }]
    })))
}

box.provider = 'box.com'

function serviceName (filename) {
  const components = filename.split('/')
  const name = components.pop()
  return (name === 'openapi-v2.json') ? 'content' : name.split('.')[0]
}
