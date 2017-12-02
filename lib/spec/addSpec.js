export function addSpec ({format, url, service, background, categories, unofficial, lang, twitter, logo}) {
  const exPatch = {info: {}}

  if (service) {
    exPatch.info['x-serviceName'] = service
  }

  if (logo) {
    exPatch.info['x-logo'] = {
      url: logo
    }

    if ((logo && logo.indexOf('.jpg') < 0) || background) {
      exPatch.info['x-logo'].backgroundColor = background || '#FFFFFF'
    }
  }

  if (unofficial) {
    exPatch.info['x-unofficialSpec'] = true
  }

  if (categories) {
    exPatch.info['x-apisguru-categories'] = categories.split(',')
  }

  if (lang) {
    exPatch.info['x-description-language'] = lang
  }

  if (twitter) {
    exPatch.info.contact = {}
    exPatch.info.contact['x-twitter'] = twitter
    exPatch.info['x-logo'] = {url: 'https://twitter.com/' + twitter + '/profile_image?size=original'}
  }

  return {
    format,
    source: url,
    exPatch
  }
}
