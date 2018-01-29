module.exports =
`
  Usage:
    key form [file]                 gets a form and either outputs to console or to file
    key form file --update          sets a form using specified file
  
  Flags:
    --update               --u      sets a form or javascript property using the specified file
    --serialiaztion-only   --s      gets/sets only the serialization_javascript property
    --visibility-only      --v      gets/sets only the visibility_javascript property
    --no-confirm           --n      skips confirmation prompts
    --overwrite            --o      overwrites existing files
    --override-server               server defaults to https://platform.driveaxleapp.com/api/v1/forms/
    --production                    sets environment to production when using keyfile
  
  Cannot get/set both serialization and visibility at the same time.
  
  Examples:
        node eleos-form-editor.js SECRETKEY SomeFormCode
  
        eleos-form-editor SECRETKEY SomeFormCode serialization.js --update --serialization
  
  You can also specify named arguments instead of positional:
        eleos-form-editor --key SECRETKEY --form SomeFormCode --file outfile.json
  
  If your key begins with -- use = to assign argument value:
        eleos-form-editor --key=--SECRETKEY
  
  If you'd like to save your key:
        eleos-form-editor --save-key production --key SECRETKEY
  
  Custom encryption key and file path: 
        eleos-form-editor --password keyboardcat --keyfile ~/.keys --save-key sandbox --key SECRETKEY
  
  Use --environment to set environment on run:
        eleos-form-editor --environment production --password keyboardcat --form SomeForm
`
