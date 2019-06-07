'use strict';

const Nanobus = require('nanobus');

function Stream() {
  Nanobus.call(this);
}

Object.create(Stream.prototype, Nanobus.prototype);
Object.assign(Stream.prototype, {
  constructor: Stream,
  pipe(dest, options) {
    const source = this;

    function ondata(chunk) {
      if (dest.writetable) {
        if (false === dest.write(chunk) && source.pause) {
          source.pause();
        }
      }
    }

    source.on('data', ondata);

    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }

    dest.on('drain', ondrain);

    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on('end', onend);
      source.on('close', onclose);
    }

    var didOnEnd = false;
    function onend() {
      if (didOnEnd) return;
      didOnEnd = true;

      dest.end();
    }

    function onclose() {
      if (didOnEnd) return;
      didOnEnd = true;

      if (typeof dest.destroy === 'function') dest.destroy();
    }

    function onerror(er) {
      cleanup();
      if (this.listeners('error').length === 0) {
        throw er; // Unhandled stream error in pipe.
      }
    }

    source.on('error', onerror);
    dest.on('error', onerror);

    function cleanup() {
      source.off('data', ondata);
      dest.off('drain', ondrain);

      source.off('end', onend);
      source.off('close', onclose);

      source.off('error', onerror);
      dest.off('error', onerror);

      source.off('end', cleanup);
      source.off('close', cleanup);

      dest.off('end', cleanup);
      dest.off('close', cleanup);
    }

    source.on('end', cleanup);
    source.on('close', cleanup);

    dest.on('end', cleanup);
    dest.on('close', cleanup);

    dest.emit('pipe', source);

    return dest;
  },
});

module.exports = Stream;
