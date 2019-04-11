# browser-host

The library creates a browser environment for executing code. Something that you miss to test browser specific things. For example, to test `fetch`, `AbortController` and other things.

## Example
write a test:
```js
const test = require('tape');

test('equality test', function (t) {
  t.plan(1);
  t.equal(1, 1);
});
```

run your test in a headless browser:
```
$ browserify test.js | browser-host

TAP version 13
# equality test
ok 1 should be equal

1..1
# tests 1
# pass  1

# ok
```

Note that you need to bundle your test file via [browserify](http://browserify.org) or any other bundler in order to run its code in the browser environment.

## Usage
```
$ browser-host [entry] [options]

Options:

  -h, --help      print usage
  -b, --browser   run Chrome / Chromium browser in non-headless mode
  --html          print resulting html only
  --mock          path to module to handle requests for mocking a dynamic back-end
```

## Install
Install via package manager (npm or yarn):
```
yarn add browser-host --dev
```

## License
> MIT License

Copyright (c) 2019 Aleksey Litvinov
