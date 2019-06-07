'use strict';

const Stream = require('./stream');

module.exports = function createSocket(opts) {
  if (typeof opts === 'string') {
    opts = { url: opts };
  }

  if (!opts) opts = {};
  if (!opts.id) {
    opts.id = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
  }

  const stream = new Stream();

  stream.writable = true;
  stream.order = 0;

  stream.write = function (msg) {
    if (stream.ended) return;

    const data = `order=${stream.order}&data=${encodeURIComponent(msg)}&id=${encodeURIComponent(opts.id)}`;
    stream.order++;

    send(data);
  };

  stream.destroy = function () {
    stream.ended = true;
    stream.emit('close');
  };

  stream.end = function (msg) {
    if (stream.ended) return;

    var data = `order=${stream.order}&id=${encodeURIComponent(opts.id)}&end=true`;
    if (msg !== undefined) data += `&data=${encodeURIComponent(msg)}`;
    stream.order++;

    send(data);

    stream.ended = true;
    stream.emit('close');
  };

  return stream;

  function send(data) {
    const input = opts.url || '/';

    window.fetch(input, {
      method: 'POST',
      mode: 'same-origin',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      referrer: 'no-referrer',
      body: data,
    });
  }
}
