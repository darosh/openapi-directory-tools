import { getOrigin } from '../utils'
import { getFormatName } from '../converter'

const cloneDeep = require('lodash/cloneDeep')

export function getSource (swagger) {
  let origin = getOrigin(swagger)
  return (Array.isArray(origin) ? origin[origin.length - 1] : origin).url
}

export function getMeta (ctx) {
  const lead = ctx.lead

  ctx.exPatch = cloneDeep(lead)
  let origin = getOrigin(ctx.exPatch)

  if (Array.isArray(origin)) {
    origin = origin.pop()
  }

  ctx.source = origin.url
  ctx.format = getFormatName(origin.format, origin.version)

  if (!ctx.exPatch.info['x-origin'].length) {
    delete ctx.exPatch.info['x-origin']
  }
}
