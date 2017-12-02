import { getSpec } from '../converter'

export function loadSpec (ctx) {
  // wrapping "Bluebird promise" in native "Promise"
  return new Promise((resolve, reject) => {
    getSpec(ctx.source, ctx.format)
      .then(spec => {
        ctx.spec = spec
        resolve()
      })
      .catch(reject)
  })
}
