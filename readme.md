# browser-host

The **browser-host** utility creates a browser environment for executing code. Something that you miss to test browser specific things. For example, to test `fetch`, `AbortController` and other things.

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

Note that if you use any external modules, probably you need to bundle your test file via [browserify](http://browserify.org) or any other bundler first in order to run its contents in the browser environment.

## Usage
```
$ browser-host [entry] [options]

Description:

  The browser-host utility reads file and executes its contents (javascript code)
  in the browser environment. The environment is created
  by headless chrome browser (via puppeteer). If file is a signle dash ('-')
  or absent, browser-host reads from the standard input.

Options:

  -h, --help      print usage
  -b, --browser   run Chrome / Chromium browser in non-headless mode
  --html          print resulting html only
  --mock          path to module to handle requests for mocking a dynamic back-end

Examples:

  $ echo "console.log('hello, world!')" | browser-host
  $ echo "console.log('hello, world!')" > a.js; browser-host a.js
```

### Dynamic backend mock
Using `--mock mock.js` you can add a custom server-side implementation to provide a stable behavior for your requests. All paths should start from `/mock`.

`mock.js` should be a plain commonjs module and export a function that accepts `req` and `res` arguments. Note that **browser-host** uses a plain `http` module to create a server.

Example:
```js
module.exports = function mock(req, res) {
  const pathname = req.url.split('?').shift();

  if (pathname === '/mock/weather') {
    const r = JSON.stringify({ weather: 'is ok' });

    res.writeHead(200, { 'content-type': 'application/json' });
    res.write(r);
    res.end();
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.write('404 not found');
  res.end();
}
```

## Install
Install via package manager (npm or yarn):
```
yarn add browser-host --dev
```

## License
> MIT License

Copyright (c) 2019 Aleksey Litvinov
