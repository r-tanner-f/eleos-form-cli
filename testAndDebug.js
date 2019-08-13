const spawn = require('child_process').spawn
const path = require('path')

module.exports.test =
function test (options) {
  const args = [
    path.join(__dirname, 'harness'),
    options.script,
    options.input,
  ]

  if (options.output) {
    args.push(options.output)
  }

  run(args, options.inspect)
}

// https://github.com/mochajs/mocha/blob/1d486155e37743e1ba3ea6384268911d7e922cd0/bin/mocha
function run (args, inspect) {
  if (inspect) {
    args.unshift('inspect')
  }

  const proc = spawn(process.execPath, args, {
    stdio: 'inherit'
  })

  proc.on('exit', (code, signal) => {
    process.on('exit', () => {
      if (signal) {
        process.kill(process.pid, signal)
      } else {
        process.exit(code)
      }
    })
  })

  // terminate children.
  process.on('SIGINT', () => {
    proc.kill('SIGTERM')
  })
}
