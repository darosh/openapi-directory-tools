let cache

export function getCache () {
  if (cache) {
    return cache
  }

  const Keyv = require('keyv')
  const mkdirp = require('mkdirp')
  mkdirp.sync('.cache')
  cache = new Keyv('sqlite://.cache/http.db')
  cache.setMaxListeners(0)
  return cache
}
