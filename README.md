# Form CLI for Eleos Mobile Platform

## Install

[Requires Node.js 6.40 or above](https://nodejs.org/en/download/)

To install, clone the repo and run `npm install` in the repo directory. You can now run with `node path/to/repo/eleos-form-cli.js ...arguments`.

Additionally, you can run `npm link` in the repo directory and add it to npm's bin. This allows you to run `eleos-form-cli ...arguments` from any terminal (cmd, cygwin, bash, etc) provided your PATH includes npm's bin. (On Windows, you may need to add this path. It's typically at `%UserProfile%\AppData\Roaming\npm`)

## Use

```
  Usage:
  key form [file]            gets a form and either outputs to console or to file
  key form file --update     sets a form using specified file

  Flags:
  --update          --u      sets a form or javascript property using the specified file
  --serialization   --s      gets/sets only the serialization_javascript property
  --visibility      --v      gets/sets only the visibility_javascript property
  --noconfirm       --n      skips confirmation prompts
  --overwrite       --o      overwrites existing files
  --overrideserver           server defaults to https://platform.driveaxleapp.com/api/v1/forms/

  Cannot get/set both serialization and visibility at the same time

  Examples:
      node eleos-form-editor.js SECRETKEY SomeFormCode

      eleos-form-editor SECRETKEY SomeFormCode serialization.js --update --serialization

  You can also specify named arguments instead of positional

  Example:
      eleos-form-editor --key SECRETKEY --form SomeFormCode --file outfile.json

  If your key begins with -- use = to assign argument value:
      eleos-form-editor --key=--SECRETKEY
```
