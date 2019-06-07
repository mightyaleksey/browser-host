#!/usr/bin/env node
'use strict'

process.title = 'browser-host'

const USAGE = `
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
`

const fs = require('fs')
const http = require('http')
const net = require('net')
const path = require('path')
const puppeteer = require('puppeteer')
const ecstatic = require('ecstatic')
const util = require('util')
const xws = require('xhr-write-stream')

const minimist = require('minimist')
const argv = minimist(process.argv.slice(2), {
  alias: {
    browser: 'b',
    help: 'h'
  },
  boolean: [
    'help'
  ]
})

if (argv.help) {
  console.log(USAGE)
  process.exit()
}

const mock = loadMockFn(argv.mock)
const entry = argv._.length > 0 && argv._[0] !== '-'
  ? fs.createReadStream(path.resolve(argv._[0]), 'utf8')
  : process.stdin

main(entry) // catch possible error

async function main (inputStream) {
  const input = await readStream(inputStream)

  if (argv.html) {
    console.log(generateHtml(input))
    return
  }

  const ws = xws()
  const serve = ecstatic({
    autoIndex: false,
    root: path.resolve(__dirname, 'bundle'),
    showDir: false,
    showDotfiles: false
  })

  const server = await createServer(handler)
  const address = getServerAddress(server)

  const browser = await puppeteer.launch({ headless: !argv.browser })
  const page = await browser.newPage()
  await page.goto(address, { waitUntil: 'networkidle0' })

  if (!argv.browser) {
    await browser.close()
    await server.close()
  }

  function handler (req, res) {
    const pathname = req.url.split('?')[0]

    if (mock !== null && /^\/mock(\/.*)?$/.test(pathname)) {
      mock(req, res)
      return
    }

    if (pathname === '/__socket') {
      req.pipe(ws(stream => stream.pipe(process.stdout, { end: false })))
      req.on('end', () => res.end())
      return
    }

    if (pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.write(generateHtml(input))
      res.end()
      return
    }

    serve(req, res)
  }
}

function loadMockFn (mock) {
  if (mock === true) {
    console.log('--mock value should be a path to a module')
    process.exit(1)
  }

  if (typeof mock === 'string') {
    var fn = null

    try {
      fn = require(path.resolve(mock))
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        console.log('Cannot find module, provided via --mock ' + mock)
      } else {
        console.log(err.message)
      }

      process.exit(1)
    }

    if (typeof fn !== 'function') {
      console.log('mock should be defined as "module.exports = function (req, res) { ... }",')
      console.log('instead got', util.inspect(fn))
      process.exit(1)
    }

    return fn
  }

  return null
}

function readStream (stream) {
  var data = ''

  stream.resume()
  stream.setEncoding('utf8')

  stream.on('data', chunk => (data += chunk))

  return new Promise((resolve, reject) => {
    stream.on('end', () => resolve(data))
    stream.once('error', reject)
  })
}

function generateHtml (input) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>browser-host</title>
  <link rel="icon" href="/favicon-96.png" sizes="96x96">
</head>
<body>
  <pre id="headless-output"></pre>
  <script type="text/javascript" src="/reporter.js"></script>
  <script type="text/javascript">
${input}
  </script>
</body>
</html>
  `.trim()
}

function getServerAddress (server) {
  var address = server.address()
  const isUnixSocket = typeof address === 'string'
  if (!isUnixSocket) {
    if (address.address.includes(':')) { // ipv6
      address = `[${address.address}]:${address.port}`
    } else {
      address = `${address.address}:${address.port}`
    }
  }

  address = `${(isUnixSocket ? '' : 'http')}://${address}/`
  return address
}

async function createServer (handler) {
  const port = await findFreePort()
  const server = http.createServer(handler)

  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(server))
    server.once('error', reject)
  })
}

function findFreePort () {
  return new Promise(resolve => getPort(resolve))

  function getPort (cb) {
    // The Internet Assigned Numbers Authority (IANA) suggests
    // the range 49152 to 65535 for dynamic or private ports.
    const port = Math.floor((65535 - 49152) * Math.random()) + 49152

    const server = net.createServer()
    server.listen(port, () => {
      server.once('close', () => cb(port))
      server.close()
    })
    server.once('error', () => getPort(cb))
  }
}
