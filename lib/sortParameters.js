const isEqual = require('lodash/isEqual')

export function sortTags (swagger) {
  if (swagger.tags) {
    swagger.tags = swagger.tags.sort(sortTFunc)
  }
}

export function sortParameters (swagger, comparison, source) {
  for (const p in swagger.paths) {
    const pathItem = swagger.paths[p]

    for (const o in pathItem) {
      if (o === 'parameters') {
        pathItem.parameters = pathItem.parameters.sort(sortPFunc)
        if (comparison && comparison.paths[p] && comparison.paths[p].parameters &&
          isEqual(pathItem.parameters, comparison.paths[p].parameters)) {
          pathItem.parameters = source.paths[p].parameters
        }
      } else {
        const op = pathItem[o]
        if (op.parameters) {
          op.parameters = op.parameters.sort(sortPFunc)
          if (comparison && comparison.paths[p] && comparison.paths[p][o] && comparison.paths[p][o].parameters &&
            isEqual(op.parameters, comparison.paths[p][o].parameters)) {
            op.parameters = source.paths[p][o].parameters
          }
        }
      }
    }
  }
}

function sortTFunc (a, b) {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return +1
  }

  return 0
}

function sortPFunc (a, b) {
  if (a.$ref && b.$ref) {
    if (a.$ref < b.$ref) {
      return -1
    } else if (a.$ref > b.$ref) {
      return +1
    }

    return 0
  }

  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return +1
  } else if (a.in < b.in) {
    return -1
  } else if (a.in > b.in) {
    return +1
  }

  return 0
}
