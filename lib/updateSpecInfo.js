import { getExtternalInfo } from './sources'
import { getSwaggerInfoPath } from './utils'
import { normalizePath } from './normalizePath'

const groupBy = require('lodash/groupBy')
const assert = require('assert')
const glog = require('gulplog')
const {colors} = require('gulp-util')

export function updateSpecInfo ({specs}) {
  return getExtternalInfo()
    .then(externals => {
      glog.info(`Loaded ${colors.cyan(externals.length)} source URLs from catalogs`)
      externals = externals.map(d => {
        d._external = true
        return d
      })

      validateUniqueUrl('specs')({specs: externals})
      validateUniquePaths('specs')({specs: externals})

      externals.forEach(d => {
        const path = getSwaggerInfoPath(d)

        if (specs[path]) {
          glog.info('skipping', path)
        } else {
          glog.info('adding', path)
          specs[path] = d
        }
      })
    })
}

function groupByUrl (specs) {
  return groupBy(specs, getOriginUrl)
}

function groupByPath (specs) {
  return groupBy(specs, getSwaggerInfoPath)
}

function getOriginUrl (info) {
  const o = info['x-origin']
  return o[o.length - 1].url
}

export function validateRelativePath (field) {
  return function (ctx) {
    const realPath = normalizePath(ctx.relative)
    const specPath = getSwaggerInfoPath(ctx[field].info)
    assert(realPath === specPath, `invalid spec path "${specPath}"`)
  }
}

export function validateUniqueUrl (field) {
  return function (ctx) {
    const specs = ctx[field]
    const urls = groupByUrl(specs)
    let issues = 0

    Object.keys(urls).forEach(u => {
      if (urls[u].length > 1) {
        issues++
        glog.error(`Duplicated url`, colors.magenta(u))
      }
    })

    if (!issues) {
      glog.info(`Duplicated url test`, colors.green('OK'))
    }
  }
}

export function validateUniquePaths (field) {
  return function (ctx) {
    const specs = ctx[field]
    const paths = groupByPath(specs)
    let issues = 0

    Object.keys(paths).forEach(u => {
      if (paths[u].length > 1) {
        issues++
        glog.error(`Duplicated path`, colors.cyan(u))
        paths[u].forEach((d, i) => {
          glog.error(`#${i}`, colors.yellow(d['x-origin'][0].url))
        })
      }
    })

    if (!issues) {
      glog.info(`Duplicated paths test`, colors.green('OK'))
    }
  }
}
