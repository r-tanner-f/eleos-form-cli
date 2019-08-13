#!/usr/bin/env node
const { test, debug } = require('./testAndDebug')
const edit = require('./edit')

const argv = require('minimist')(process.argv.slice(2), {
  /* eslint-disable no-multi-spaces */
  boolean: [
    'test', 't',
  ]
  /* eslint-enable */
})

if (argv.test || argv.t) {
  const isInspect = a => a === 'inspect'

  const inspect = argv._.some(isInspect)
  const posArgs = argv._.filter(a => !isInspect(a))

  const options = {
    script: argv.script || posArgs[0],
    input: argv.input || argv.in || posArgs[1],
    output: argv.output || argv.out || posArgs[2],
    inspect
  }

  test(options)

} else {
  edit()
}
