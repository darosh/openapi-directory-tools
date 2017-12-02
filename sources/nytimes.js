import { listGitHubFilesAsync, rawGitHubUrl } from '../lib/github'

export function nytimes () {
  return listGitHubFilesAsync('NYTimes', 'public_api_specs', '**/*.json')
    .then(files => files.map(filename => ({
      'x-providerName': 'nytimes.com',
      'x-serviceName': filename.split('/')[0],
      'x-origin': [{
        url: rawGitHubUrl('NYTimes', 'public_api_specs', filename),
        format: 'swagger',
        version: '2.0'
      }]
    })))
}

nytimes.provider = 'nytimes.com'
