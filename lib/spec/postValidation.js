const isEmpty = require('lodash/isEmpty')

export function postValidation (ctx) {
  const validation = ctx.validation

  validation.info = validation.info || []

  if (validation.warnings) {
    validation.warnings = validation.warnings.reduce((r, warning) => {
      if (((warning.code === 'UNUSED_DEFINITION') || (warning.code === 'EXTRA_REFERENCE_PROPERTIES'))) {
        validation.info.push(warning)
      } else {
        r.push(warning)
      }

      return r
    }, [])
  }

  validation.warnings = validation.warnings || []

  if (validation.remotesResolved) {
    ctx.swagger = validation.remotesResolved
    delete validation.remotesResolved
  }

  if (isEmpty(ctx.swagger.paths)) {
    ctx.validation.warnings.push({code: 'MISSING_PATHS', message: `Missing paths`})
  }

  if (!ctx.swagger.info.description) {
    ctx.validation.warnings.push({code: 'MISSING_DESCRIPTION', message: `Missing description`})
  }

  validation.warnings = validation.warnings.length ? validation.warnings : null
  validation.info = validation.info.length ? validation.info : null
}
