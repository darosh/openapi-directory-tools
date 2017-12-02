export const jsondiffpatch = require('jsondiffpatch').create({
  arrays: {
    includeValueOnMove: true
  },
  objectHash: function (obj, index) {
    // this function is used only to when objects are not equal by ref
    // add swagger specific properties
    return obj._id || obj.id || obj.name || obj.operationId || '$$index:' + index
  }
})

export function replaceSpaces (str) {
  return str.replace(/ /g, '_')
}
