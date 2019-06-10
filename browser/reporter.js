'use strict'

const inspect = require('object-inspect')
const createSocket = require('./client-socket')
const _write = createSocket()

const outputNode = document.querySelector('#headless-output')

function write (a) {
  if (outputNode) outputNode.appendChild(document.createTextNode(a))
  _write(a)
}

function serialize (...args) {
  var index = 1
  var message = args[0]

  if (typeof message === 'string') {
    message = message.replace(/(^|[^%])%[sd]/g, (_, s) => s + args[index++])
  } else {
    message = inspect(message)
  }

  for (; index < args.length; ++index) {
    message += ' ' + inspect(args[index])
  }

  return message
}

;['debug', 'dir', 'dirxml', 'error', 'info', 'log', 'table', 'warn']
  .forEach(method => {
    const old = console[method]
    console[method] = (...args) => {
      write(serialize(...args) + '\n')
      if (old) old.apply(console, args)
    }
  })

const olderror = window.onerror
window.onerror = function (msg, url, lineNo, columnNo, er) {
  const name = (er && er.name) || 'Error'
  const message = (er && er.message) || msg

  var str = `${(er ? `${name}: ` : '')}${message} on line ${lineNo}`
  if (columnNo) str += `:${columnNo}`

  if (er && er.stack) {
    er.stack.split('\n').slice(1).forEach(line => {
      str += `\n  ${line.replace(url, '').trim()}`
    })
  }

  write(str + '\n', { error: true })
  if (olderror) olderror.apply(window, arguments)
  return false
}
