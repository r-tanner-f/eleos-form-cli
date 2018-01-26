#!/usr/bin/env node
const readlineSync = require('readline-sync')
const request = require('request')
const fs = require('fs')
const crypto = require('crypto')
const algo = 'aes-256-cbc'

const argv = require('minimist')(process.argv.slice(2), {
  /* eslint-disable no-multi-spaces */
  boolean: [
    'update',             'u',
    'serialization-only', 's',
    'visibility-only',    'v',
    'no-confirm',         'n',
    'overwrite',          'o'
  ]
  /* eslint-enable */
})

const serverUrl = argv['override-server'] || 'https://platform.driveaxleapp.com/api/v1/forms/'
const serializationOnly = argv['serialization-only'] || argv.s
const visibilityOnly = argv['visibility-only'] || argv.v
const noConfirm = argv['no-confirm'] || argv.n
const overwrite = argv.overwrite || argv.o
const update = argv.update || argv.u
const help = argv.help || argv.h

const encryptionKey = argv.p || argv['password'] || '4RVo!SYwKaZXSqZ@CEQ2Nx'
const keyfilePath = argv.keyfile || argv.k || process.env.Home + '.eleos-form-cli'
const environment = argv.environment || argv.e || 'sandbox'
const setKey = argv['set-key']

const useKeyfile = setKey ? false : getKeyfile()
const key = argv.key || argv._[0] || useKeyfile
const form = argv.form || (useKeyfile ? argv._[0] : argv._[1])
const file = argv.file || (useKeyfile ? argv._[1] : argv._[2])

if (setKey && key) {
  setKeyfile()
  console.log(`Key set for ${setKey} environment`)
  process.exit(0)
}

if (help || !key || !form || (serializationOnly && visibilityOnly)) {
  console.log('\n  Usage:')
  console.log('  key form [file]                 gets a form and either outputs to console or to file')
  console.log('  key form file --update          sets a form using specified file')
  console.log('\n  Flags:')
  console.log('  --update               --u      sets a form or javascript property using the specified file')
  console.log('  --serialiaztion-only   --s      gets/sets only the serialization_javascript property')
  console.log('  --visibility-only      --v      gets/sets only the visibility_javascript property')
  console.log('  --no-confirm           --n      skips confirmation prompts')
  console.log('  --overwrite            --o      overwrites existing files')
  console.log('  --override-server               server defaults to https://platform.driveaxleapp.com/api/v1/forms/')
  console.log('\n  Cannot get/set both serialization and visibility at the same time.')
  console.log('\n  Examples:')
  console.log('      node eleos-form-editor.js SECRETKEY SomeFormCode')
  console.log('\n      eleos-form-editor SECRETKEY SomeFormCode serialization.js --update --serialization')
  console.log('\n  You can also specify named arguments instead of positional. For example:')
  console.log('      eleos-form-editor --key SECRETKEY --form SomeFormCode --file outfile.json')
  console.log('\n  If your key begins with -- use = to assign argument value:')
  console.log('      eleos-form-editor --key=--SECRETKEY')
  console.log('\n  If you\'d like to save your key:')
  console.log('      eleos-form-editor --save-key production --key SECRETKEY')
  console.log('\n  Custom encryption key and file path: ')
  console.log('      eleos-form-editor --password keyboardcat --keyfile ~/.keys --save-key sandbox --key SECRETKEY')
  console.log('\n  Use --environment to set environment on run:')
  console.log('      eleos-form-editor --environment production --password keyboardcat --form SomeForm')

  process.exit(1)
}

const eleosRequest = {
  uri: `${serverUrl}${form}`,
  headers: {
    Authorization: `key=${key}`
  }
}

let fileContent = null
if (file && update) {
  fileContent = fs.readFileSync(file, 'utf-8')
}

function getKeyfile () {
  try {
    const encrypted = JSON.parse(
      fs.readFileSync(keyfilePath, 'utf-8')
    )

    const decipher = crypto.createDecipher(algo, encryptionKey)
    let result = decipher.update(encrypted[environment], 'hex', 'utf8')
    result += decipher.final('utf8')
    return result
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    } else {
      throw err
    }
  }
}

function setKeyfile () {
  let encrypted

  try {
    encrypted = JSON.parse(
      fs.readFileSync(keyfilePath, 'utf-8')
    )
  } catch (err) {
    if (err.code === 'ENOENT') {
      encrypted = {}
    } else {
      throw err
    }
  }

  const cipher = crypto.createCipher(algo, encryptionKey)
  let crypted = cipher.update(key, 'utf-8', 'hex')
  crypted += cipher.final('hex')
  encrypted[setKey || environment] = crypted

  fs.writeFileSync(
    keyfilePath,
    JSON.stringify(encrypted, null, 4),
    { flag: 'w' }
  )
}

function abort () {
  console.error('ABORTING!\n', ...arguments)
  process.exit(1)
}

function callHandle (callback) {
  return (err, resp, body) => {
    if (err || (resp && resp.statusCode !== 200)) {
      abort(err, body, resp ? resp.statusCode : undefined)
    }
    callback(body)
  }
}

function confirm (op, message) {
  let isConfirmed = false
  if (!noConfirm) {
    isConfirmed = readlineSync.keyInYN(message + ' Continue?')
  }

  const confirmed = noConfirm || isConfirmed

  if (confirmed) {
    op()
  } else {
    abort('Op not confirmed!')
  }
}

function consoleOrWrite (data) {
  if (file) {
    fs.writeFileSync(file, data, { flag: overwrite ? 'w' : 'wx' })
  } else {
    console.log(data)
  }
}

function getForm (callback) {
  request.get(eleosRequest, callHandle(callback))
}

function updateForm (form) {
  console.log('UPDATING...\n')

  const req = Object.assign(eleosRequest, {
    body: form || JSON.parse(fileContent),
    json: true
  })
  request.put(req, callHandle(body => console.log('SUCCESS:\n', body)))
}

function updateSerializationJavascript () {
  getForm(f => {
    const parsedForm = JSON.parse(f)
    parsedForm.serialization_javascript = fileContent
    updateForm(parsedForm)
  })
}

function updateVisibilityJavascript () {
  getForm(f => {
    const parsedForm = JSON.parse(f)
    parsedForm.visibility_javascript = fileContent
    updateForm(parsedForm)
  })
}

if (!update) {
  getForm(body => {
    const result = JSON.parse(body)
    if (serializationOnly) {
      return consoleOrWrite(result.serialization_javascript)
    }

    if (visibilityOnly) {
      return consoleOrWrite(result.visibility_javascript)
    }

    consoleOrWrite(JSON.stringify(result, null, 4))
  })
} else {
  switch (true) {
    case serializationOnly:
      confirm(updateSerializationJavascript, `This will update the SERIALIZATION function on the form ${form} using ${file}.`)
      break
    case visibilityOnly:
      confirm(updateVisibilityJavascript, `This will update the VISIBILITY function on the form ${form} using ${file}.`)
      break
    default:
      confirm(updateForm, `This will update form ${form} with file ${file}.`)
      break
  }
}
