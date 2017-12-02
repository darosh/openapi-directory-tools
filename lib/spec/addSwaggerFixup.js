import { getSwaggerPath, readYamlAsync } from '../utils'

export function addSwaggerFixup () {
  return function (ctx) {
    return readYamlAsync(getSwaggerPath(ctx.swagger, 'fixup.yaml'))
      .then(swaggerFixup => (ctx.swaggerFixup = swaggerFixup))
  }
}
