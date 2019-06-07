'use strict'

module.exports = createSocket

function createSocket (opts) {
  if (typeof opts === 'string') opts = { url: opts }
  if (!opts) opts = {}
  if (!opts.id) opts.id = Math.floor(Math.pow(16, 8) * Math.random()).toString(16)

  const input = new URL(opts.url || '/__socket', window.location.href).toString()
  var ended = false
  var order = 0

  return write

  function write (message, params) {
    if (ended) return
    var data = 'order=' + order++

    if (params !== null && typeof params === 'object') {
      if (params.end) {
        data += '&end=true'
        ended = true
      }
      if (params.error) data += '&error=true'
    }
    if (message) data += '&data=' + message

    send(data)
  }

  function send (data) {
    window.fetch(input, {
      method: 'POST',
      mode: 'same-origin',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      referrer: 'no-referrer',
      body: data
    })
  }
}
