import * as sources from '../sources'
import { getOrigin, getOriginUrl, getProviderName, getServiceName, getSwaggerPath } from './utils'

const assert = require('assert')
const {log, colors} = require('gulp-util')
const {readFileSync} = require('fs')

const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const values = require('lodash/values')
const omit = require('lodash/omit')
const flatten = require('lodash/flatten')
const intersection = require('lodash/intersection')

export const deletions = []

export const specSources = Object.keys(sources).reduce((r, d) => {
  r[sources[d].provider] = sources[d]
  return r
}, {})

const catalogProviders = Object.keys(specSources)

export function getCatalogsLeads (providers = catalogProviders, blacklist) {
  const {load} = require('js-yaml')
  const black = load(readFileSync(blacklist))

  return Promise.all(providers.map(key => specSources[key]()))
    .then(results => Array.prototype.concat.apply([], results).filter(d => black.indexOf(d.info['x-origin'][0].url) === -1))
}

export function getExtternalInfo (providers = catalogProviders) {
  return Promise.all(providers.map(key => specSources[key]()))
    .then(results => {
      providers.forEach((d, i) => {
        log('Loaded catalogue', colors.magenta(providers[i]), colors.cyan(results[i].length), 'source URLs')
      })
      return Array.prototype.concat.apply([], results)
    })
}

export function getLeadsAsync (specs, blacklist) {
  const specsByProvider = groupBy(values(specs), swagger => swagger.info['x-providerName'])

  let urlLeads = flatten(values(omit(specsByProvider, catalogProviders))).map(swagger => ({
    info: {
      'version': swagger.info.version,
      'x-providerName': getProviderName(swagger),
      'x-serviceName': getServiceName(swagger),
      'x-origin': getOrigin(swagger)
    }
  }))

  const usedCatalogs = intersection(Object.keys(specsByProvider), catalogProviders)

  return getCatalogsLeads(usedCatalogs, blacklist)
    .then(catalogLeads => {
      let leads = values(catalogLeads).concat(urlLeads)

      leads = indexByOriginUrl(leads)

      const urls = Object.keys(specs).map(k => getOriginUrl(specs[k]))

      // add new catalog leads (MER)
      for (const l in leads) {
        const lead = leads[l]
        const filename = getSwaggerPath(lead)

        if (!specs[filename] && (urls.indexOf(getOriginUrl(lead)) === -1)) { // we should compare on origin url
          log(colors.magenta('adding'), filename)
          specs[filename] = lead
        }
      }

      return mapValues(specs, (swagger, filename) => {
        const lead = leads[getOriginUrl(swagger)]

        if (!lead) {
          deletions.push(filename)
        }

        return lead
      })
    })
}

function indexByOriginUrl (leads) {
  return mapValues(groupBy(leads, getOriginUrl), function (array, url) {
    if (array.length > 1) {
      array = [array[array.length - 1]]
    }

    assert(array.length === 1, `Duplicate leads for "${url}" URL.`)
    return array[0]
  })
}
