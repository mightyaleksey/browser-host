'use strict'

const Stream = require('stream')
const concatStream = require('concat-stream')
const qs = require('querystring')

module.exports = {
  Socket,
  createPool
}

function createPool (opts) {
  if (!opts) opts = {}
  if (typeof opts.timeout !== 'number') opts.timeout = 0

  const streams = {}
  return createInputStream

  function createInputStream (cb) {
    const inputStream = concatStream({ encoding: 'string' }, message => {
      const params = qs.parse(message)
      params.order = Number(params.order)

      var stream = streams[params.id]
      if (!stream) {
        stream = streams[params.id] = new Socket(opts.timeout)
        stream.once('close', () => {
          delete streams[params.id]
          if (!inputStream.closed) inputStream.emit('close')
        })
        cb(stream)
      }

      stream.resetTimeout()
      stream.emit('params', params)
    })

    inputStream.once('close', () => (inputStream.closed = true))
    return inputStream
  }
}

function Socket (timeout) {
  Stream.call(this)

  const stream = this
  stream.order = 0
  stream.queue = {}
  stream.readable = true
  stream.timeout = timeout
  stream.resetTimeout()

  stream.on('params', params => {
    if (params !== null && typeof params === 'object') {
      if (params.order === this.order) {
        handleParams(params)
        stream.order++

        while (stream.queue[stream.order] !== undefined) {
          handleParams(stream.queue[stream.order])
          delete stream.queue[stream.order]
          stream.order++
        }
      } else {
        stream.queue[params.order] = params
      }
    } else {
      this.emit('data', params)
    }
  })

  function handleParams (params) {
    if (params.error) {
      stream.emit('error', params.data)
      closeStream()
      return
    } else {
      stream.emit('data', params.data)
    }

    if (params.end) closeStream()
  }

  function closeStream () {
    if (stream.timeout > 0) clearTimeout(stream._timeoutId)
    stream.emit('end')
    stream.emit('close')
  }
}

Socket.prototype = Object.create(Stream.prototype)
Object.assign(Socket.prototype, {
  constructor: Socket,

  resetTimeout () {
    if (this.timeout > 0) {
      clearTimeout(this._timeoutId)
      this._timeoutId = setTimeout(() => {
        this.emit('timeout')
        this.emit('close')
      }, this.timeout)
    }
  }
})
