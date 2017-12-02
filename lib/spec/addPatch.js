import { readYamlAsync, getPathComponents } from '../utils'

const jsonPatch = require('json-merge-patch')
const {join} = require('path')

export function addPatch (rootDir) {
  return (ctx) => {
    const components = getPathComponents(ctx.exPatch)
    components[components.length - 1] = getPathComponents(ctx.swagger).pop()

    return loadPatch(rootDir, components)
      .then(patch => (ctx.patch = patch))
  }
}

function loadPatch (rootDir, pathComponents) {
  let patch = {}
  let path = rootDir

  return Promise.all(pathComponents.map((dir) => {
    path = join(path, dir)
    return readYamlAsync(join(path, 'patch.yaml'))
  })).then(subPatches => {
    subPatches.forEach(subPatch => {
      if (subPatch) {
        patch = jsonPatch.merge(patch, subPatch)
      }
    })

    return patch
  })
}
