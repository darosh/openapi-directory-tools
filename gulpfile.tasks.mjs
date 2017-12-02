/* eslint-disable camelcase */

import { getSimpleInfo } from './lib/getSimpleInfo'

import { s3 as _s3 } from './tasks/s3'
import { stringify, setCompact, editFile, setCacheFirst, setCacheFolder } from './lib'
import { fixupFile, getSwaggerPath } from './lib/utils'
import {
  api,
  apis,
  badge,
  empty,
  git,
  json,
  leads as _leads,
  logo, merge,
  online,
  patch,
  preferred,
  swagger,
  transform as $,
  validate,
  yaml
} from './plugins'
import {
  getFixup,
  refreshFixup,
  addSpec,
  addFixes,
  addPatch,
  addSwaggerFixup,
  applyFixup,
  convertToSwagger,
  expandPathTemplates,
  extractApiKeysFromParameters,
  getMeta,
  loadSpec,
  patchSwagger,
  postValidation,
  replaceSpacesInSchemaNames,
  runValidateAndFix,
  simplifyProduceConsume
} from './lib/spec'
import { updateSpecInfo, validateRelativePath, validateUniqueUrl } from './lib/updateSpecInfo'

const {readFile} = require('fs')
const {src, dest, task, series, parallel} = require('gulp')
const {log, colors} = require('gulp-util')
const rename = require('gulp-rename')
const del = require('del')
const gif = require('gulp-if')
const {readFileSync} = require('fs')
const {join, basename} = require('path')

const defaults = {
  apis: 'APIs/**/swagger.yaml',
  background: '#FFFFFF',
  base: 'APIs',
  bucket: 'api.apis.guru',
  fixups: 'APIs/**/fixup.yaml',
  format: 'swagger_2',
  region: 'us-east-1'
}

const {argv} = require('yargs')
  .alias({
    apis: 'a',
    background: 'b',
    categories: 'c',
    lang: 'd',
    fix: 'f',
    logo: 'l',
    service: 's',
    twitter: 't',
    unofficial: 'u'
  })
  .default('apis', defaults.apis)
  .default('background', defaults.background)
  .default('base', defaults.base)
  .default('bucket', defaults.bucket)
  .default('cache', true)
  .default('compact', true)
  .default('format', defaults.format)
  .default('git', true)
  .default('logs', true)
  .default('region', defaults.region)

const _ = (d) => gif(file => !!file.contents, dest(d))
const L = (d) => gif(file => argv.logs && !!file.contents, dest(d))
const bold = (d) => `[${colors.bold(d)}]`
const D = (d) => gif(file => argv.debug && !!file.contents, dest(d))
const O = (d) => gif(file => !!file.contents, dest(d))

/**
 * Configuration
 */

setCacheFirst(argv.cache)
setCacheFolder('.cache')
setCompact(argv.compact)

/**
 * Clean tasks
 */

const clean_cache = () => del(['.cache'])
clean_cache.description = 'Delete ".cache" folder'
task('clean_cache', clean_cache)

const clean_dist = () => del(['.dist'])
clean_dist.description = 'Delete ".dist" folder'
task('clean_dist', clean_dist)

const clean_logs = () => del(['.logs'])
clean_logs.description = 'Delete ".logs" folder'
task('clean_logs', clean_logs)

const clean_http = () => del(['.cache/http', '.cache/https', '.cache/http.db'])
clean_http.description = 'Delete HTTP cache and stored responses'
task('clean_http', clean_http)

const clean_specs = () => del(['.dist/v2/specs', '.dist/v2/*.json'])
clean_specs.description = 'Delete built specs'
task('clean_specs', clean_specs)

const clean_test = () => del(['.cache/test'])
clean_test.description = 'Delete ".cache/test" folder'
task('clean_test', clean_test)

const clean_debug = () => del(['.debug'])
clean_debug.description = 'Delete ".cache/test" folder'
task('clean_debug', clean_debug)

const clean = parallel('clean_logs', 'clean_cache', 'clean_dist', 'clean_debug')
clean.description = 'Delete all artifact folders'
task('clean', clean)

/**
 * Helper tasks
 */

task('online', online())

/**
 * Test tasks
 */

const test = () => src(argv.apis, {base: argv.base})
  .pipe(json())
  .pipe(validate('.cache/test'))
  .pipe($('fatal')).pipe(L('.logs/fatal'))
  .pipe($('validation.warnings')).pipe(L('.logs/test.warnings'))
  .pipe($('validation.errors')).pipe(L('.logs/test.errors'))
  .pipe($('validation.info')).pipe(L('.logs/test.info'))
  .pipe(preferred())
test.description = 'Validate API specifications'
test.flags = {
  '-a --apis <GLOB>': ` ${bold(defaults.apis)}`,
  '--no-logs': ' do not write ".logs/**" files'
}
task('test', test)

/**
 * Spec pipes
 */

function writeSpec (pipe) {
  return pipe.pipe($(loadSpec, 'spec', 8)).pipe(D('.debug/spec'))
    .pipe($(addFixes('fixes'), 'fixup', 8)).pipe(D('.debug/fixup'))
    .pipe($(applyFixup, 'spec')).pipe(D('.debug/fixed'))
    .pipe($(convertToSwagger, 'swagger'))
    .pipe(D('.debug/convert'))
    .pipe($(addPatch(argv.base), 'patch', 8)).pipe(D('.debug/patch'))
    .pipe($(addSwaggerFixup, 'swaggerFixup', 8)).pipe(D('.debug/swaggerFixup'))

    .pipe($(patchSwagger, 'swagger'))
    .pipe($(ctx => {
      ctx.path = getSwaggerPath(ctx.swagger)
      ctx.base = '.'
    }))
    .pipe($(expandPathTemplates, 'swagger'))
    .pipe($(replaceSpacesInSchemaNames, 'swagger'))
    .pipe($(extractApiKeysFromParameters, 'swagger'))
    .pipe($(simplifyProduceConsume, 'swagger'))

    .pipe(D('.debug/patched'))

    .pipe($(runValidateAndFix))
    .pipe($(postValidation))
}

/**
 * Spec tasks
 */

const urls = () => src(argv.apis, {base: argv.base})
  .pipe(json())
  .pipe($(file => { console.logs(file.json.info['x-origin'].pop().url) }))
urls.description = 'Show source url for definitions'
urls.flags = {
  '-a --apis <GLOB>': ` ${bold(defaults.apis)}`
}
task(urls)

const add = () => {
  let pipe = empty(Object.assign({path: 'swagger.yaml'}, addSpec(argv)))

  return writeSpec(pipe)
    .pipe(yaml('swagger'))
    .pipe($(file => {
      file.path = getSwaggerPath(file.swagger)
      file.base = '.'
    }))
    .pipe($(patch(argv.base)))
    .pipe(O(argv.base))
}
add.description = 'Add new definition'
add.flags = {
  '-b --background <BACKGROUND>': ` specify background colour ${bold(defaults.background)}`,
  '-d --lang <LANG>': ' specify description language',
  '-c --categories <CATEGORIES>': ' csv list of categories',
  '--fix': ' try to fix definition',
  '-l --logo <LOGO>': ' specify logo url',
  '-s --service <NAME>': ' supply service name',
  '-t --twitter <NAME>': ' supply x-twitter account, logo not needed',
  '-u --unofficial': ' set unofficial flag',
  '-f --format <FORMAT>': ` ${bold(defaults.format)}`,
  '--url <URL>': ' spec URL'
}
task(add)

const update_leads = () => {
  log('Reading', `'${colors.cyan(argv.apis)}'`)

  let pipe = src(argv.apis, {base: argv.base})
    .pipe(json())
    .pipe(_leads(join(__dirname, 'sources/blacklist.yaml')))
    .pipe(rename({extname: '.json'}))
    .pipe($('lead')).pipe(D('.debug/lead'))
    .pipe($(getMeta))

  return writeSpec(pipe)
    .pipe(rename({extname: '.yaml'}))
    .pipe(yaml('swagger'))
    .pipe($(patch(argv.base)))
    .pipe($(file => new Promise(resolve => {
      if (file.validation && file.validation.errors) {
        file.contents = null
        log(colors.red('validation errors'), colors.grey(file.relative))
        resolve()
      } else if (file.contents) {
        readFile(join(argv.base, file.relative), 'utf8', (err, text) => {
          if (!err && (text.split(/\r\n|\r|\n/g).join('\n') === file.contents.toString())) {
            log(colors.green('skipping identical'), colors.grey(file.relative))
            file.contents = null
          } else if (err) {
            log(colors.red('adding new'), colors.grey(file.relative))
          }
          resolve()
        })
      } else {
        resolve()
      }
    })), null, 8)
    .pipe(O(argv.base))

    .pipe($('warnings')).pipe(L('.logs/warnings'))
    .pipe($('fatal')).pipe(L('.logs/fatal'))
    .pipe($('validation.warnings')).pipe(L('.logs/validation.warnings'))
    .pipe($('validation.errors')).pipe(L('.logs/validation.errors'))
    .pipe($('validation.info')).pipe(L('.logs/validation.info'))
}
task('update_leads', update_leads)

const update = series('online', 'clean_logs', 'update_leads')
update.description = 'Update specs from sources'
update.flags = {
  '-a --apis <GLOB>': ` ${bold(defaults.apis)}`,
  '--debug': ' write ".debug/**" files',
  '--no-cache': ' use "RFC compliant cache", instead of "use cache first"',
  '--no-logs': ' do not write ".logs/**" files'
}
task('update', update)

task('u2', () => {
  log('Reading', `'${colors.cyan(argv.apis)}'`)

  let pipe = src(argv.apis, {base: argv.base})
    .pipe(json('stored', false))
    .pipe($(validateRelativePath('stored')))
    .pipe(merge(getSimpleInfo('stored'), 'specs'))
    .pipe($(validateUniqueUrl('specs')))
    .pipe($(updateSpecInfo))
    .pipe($('specs')).pipe(dest('.specs.info'))

  return pipe
})

const leads = () => {}
leads.description = 'Add/remove definitions from 3rd-party catalogs'
task('leads', leads)

const check = () => {}
check.description = 'Check status of x-preferred flags only'
task('check', check)

const fixup = () => src(argv.swagger, {base: argv.base})
  .pipe(dest('.tmp'))
  .pipe($(
    (file) => editFile(file.path, {editor: argv.editor})
      .then(edited => {
        file.path = fixupFile(file.history[0])
        file.contents = Buffer.from(getFixup(file.path, file.contents.toString(), edited))
      })
  ))
  .pipe(O(argv.base))
fixup.description = 'Update "fixup.yaml" for specified "swagger.yaml"'
fixup.flags = {
  '--swagger <FILE>': ' path to "swagger.yaml"',
  '--editor <EDITOR>': ' editor executable'
}
task('fixup', fixup)

const refresh = () => src(argv.fixups, {base: argv.base})
  .pipe($(refreshFixup))
  .pipe(dest(argv.base))
refresh.description = 'Read and write back "fixup.yaml" files'
task('refresh', refresh)

/**
 * Build tasks
 */

const build_badges = () => {
  const metrics = JSON.parse(readFileSync('.dist/v2/metrics.json'))
  return empty()
    .pipe(badge('.dist/badges', [
      ['APIs in collection', metrics.numAPIs, 'orange'],
      ['Endpoints', metrics.numEndpoints, 'red'],
      ['OpenAPI specs', metrics.numSpecs, 'yellow'],
      ['Tested on', metrics.numSpecs + ' specs', 'green', readFileSync('branding/icon-16x16.png', 'base64')]]))
    .pipe(dest('.dist/badges'))
}
build_badges.description = 'Download shield.io images'
task('build_badges', build_badges)

const build_specs = () => src(argv.apis, {base: argv.base})
  .pipe(json()) // stores 'contents' in 'yaml', adds 'json', converts to JSON
  .pipe(logo('.dist/v2/cache/logo')) // adds 'logo'
  .pipe(gif(argv.git, git())) // adds 'dates'
  .pipe(api('https://api.apis.guru/v2/cache/logo/')) // modifies 'json.info'
  .pipe(rename({extname: '.json'}))
  .pipe($('json'))
  .pipe(dest('.dist/v2/specs'))
  .pipe(yaml())
  .pipe(rename({extname: '.yaml'}))
  .pipe(dest('.dist/v2/specs'))
  .pipe(apis('https://api.apis.guru/v2/', 'list.json', 'metrics.json')) // creates <api.json> and <metrics.json>
  .pipe(dest('.dist/v2'))
build_specs.description = 'Build specifications and logos'
build_specs.flags = {
  '-a --apis <GLOB>': ` ${bold(defaults.apis)}`,
  '--no-git': ' do not add "added" and "modified" dates from Git log',
  '--no-compact': ' do not use "json-stringify-pretty-compact"'
}
task('build_specs', build_specs)

task('build_index', () => src('resources/index.html').pipe(dest('.dist/v2')))

const build_swagger = () => src('resources/apis_guru_swagger.yaml')
  .pipe(json())
  .pipe(swagger('https://api.apis.guru/v2/'))
  .pipe(rename('swagger.json'))
  .pipe(dest('.dist/v2'))
  .pipe(yaml())
  .pipe(rename('swagger.yaml'))
  .pipe(dest('.dist/v2'))
task('build_swagger', build_swagger)

const build = series('clean_specs', 'build_specs', 'build_index', 'build_swagger', 'build_badges')
build.description = 'Build all'
task('build', build)

/**
 * Publish tasks
 */

const s3 = () => _s3([['.dist/**', '']], {
  region: argv.region,
  params: {Bucket: argv.bucket}
}, '.cache/s3.json')
s3.description = 'Publish to S3'
s3.flags = {
  '--bucket <BUCKET>': ` ${bold(defaults.bucket)}`,
  '--region <REGION>': ` ${bold(defaults.region)}`
}
task('s3', s3)

const deploy = series('online', 'build', 's3')
deploy.description = 'Build and deploy to S3'
task('deploy', deploy)

const test_and_deploy = series('test', 'deploy')
test_and_deploy.description = 'Main CI task'
task('test_and_deploy', test_and_deploy)

/**
 * Default task
 */

function _default (done) {
  log('Tools version', colors.cyan(require('./package.json').version))
  log('Engine version', colors.cyan(process.version))
  log('Gulp CLI version', colors.cyan(require('gulp-cli/package.json').version))
  log('Local Gulp version', colors.cyan(require('gulp/package.json').version))
  log('Working directory', colors.magenta(process.cwd()))

  if (argv.arguments) {
    log('Arguments', colors.magenta(stringify(argv)))
  }

  if (argv.modules) {
    log('Modules', Object.keys(require.cache).map(d => colors.magenta(basename(d.replace(/(index)?\.js$/, '')))).reduce((r, d) => {
      if (r.indexOf(d) === -1) {
        r.push(d)
      }
      return r
    }, []).sort().join(', '))
  }

  done()
}

_default.description = 'Show versions'
_default.flags = {
  '--modules': ' show loaded modules',
  '--arguments': ' show parsed arguments'
}
task('default', _default)
