import { listGitHubFilesAsync, rawGitHubUrl } from '../lib/github'

export function bcgov () {
  return listGitHubFilesAsync('bcgov', 'api-specs', '**/*.json')
    .then(files => files.map(filename => ({
      'x-providerName': bcgov.provider,
      'x-serviceName': filename.split('/')[0],
      'x-origin': [{
        url: rawGitHubUrl('bcgov', 'api-specs', filename),
        format: 'swagger',
        version: '2.0'
      }]
    })))
}

// TODO bcgov.provider = 'gov.bc.ca'
bcgov.provider = 'bclaws.ca'
