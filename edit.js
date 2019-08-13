const readlineSync = require('readline-sync')
const request = require('request')
const fs = require('fs')
const crypto = require('crypto')

const helptext = require('./help')

module.exports = function edit () {
  const argv = require('minimist')(process.argv.slice(2), {
    /* eslint-disable no-multi-spaces */
    boolean: [
      'update',             'u',
      'serialization-only', 's',
      'visibility-only',    'v',
      'no-confirm',         'n',
      'overwrite',          'o',
      'test',               't',
      'debug',              'd',
      'set-key'
    ]
    /* eslint-enable */
  })

  const algo = 'aes-256-cbc'
  const serverUrl = argv['override-server'] || 'https://platform.driveaxleapp.com/api/v1/forms/'
  const serializationOnly = argv['serialization-only'] || argv.s
  const visibilityOnly = argv['visibility-only'] || argv.v
  const noConfirm = argv['no-confirm'] || argv.n
  const overwrite = argv.overwrite || argv.o
  const update = argv.update || argv.u
  const help = argv.help || argv.h

  const encryptionKey = argv.p || argv['password'] || '4RVo!SYwKaZXSqZ@CEQ2Nx'
  const keyfilePath = argv.keyfile || argv.k || process.env.Home + '.eleos-form-cli'
  const environment = argv.environment || argv.e || argv.production ? 'production' : 'sandbox'
  const setKey = argv['set-key']

  const useKeyfile = setKey ? false : getKeyfile()
  const key = argv.key || useKeyfile || argv._[0]
  const form = argv.form || (useKeyfile ? argv._[0] : argv._[1])
  const file = argv.file || (useKeyfile ? argv._[1] : argv._[2])

  if (setKey && key) {
    setKeyfile()
    console.log(`Key set for ${typeof setKey === 'string' ? setKey : environment} environment`)
    process.exit(0)
  }

  if (help || !key || !form || (serializationOnly && visibilityOnly)) {
    console.error(helptext)
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
      try {
        result += decipher.final('utf8')
      } catch (err) {
        console.error(`Problem decrypting ${environment} environment key\nBad password? Use --password to specifiy decrypt password`)
        process.exit(1)
      }

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
    encrypted[typeof setKey === 'string' ? setKey : environment] = crypted

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
}
