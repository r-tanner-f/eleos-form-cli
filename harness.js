const vm = require('vm')
const fs = require('fs')
const assert = require('assert')
const util = require('util')

function readAndParse (filename) {
  return JSON.parse(
    fs.readFileSync(filename, 'utf-8')
  )
}

const script = fs.readFileSync(process.argv[2], 'utf-8')
const input = readAndParse(process.argv[3])
const outputFile = process.argv[4]

const output = outputFile ? readAndParse(outputFile) : false

const context = {
  input,
  output,
  result: {}
}

vm.runInNewContext(
  `const functionUnderTest = ${script}\ndebugger\nresult = functionUnderTest(input)`,
  context
)

console.log('Returned:\n', JSON.stringify(context.result, null, 4))

if (output) {
  assert.deepStrictEqual(context.result, output)
  console.log('Test passed!')
}
