import { jsondiffpatch } from './utils'

export function applyFixup ({spec, fixup}) {
  jsondiffpatch.patch(spec, fixup)
}
