import { inspect } from 'util';
import Stream from 'stream';
import createSocket from './socket';

const ws = createSocket('/__socket');

const documentWrite = (function () {
  const node = document.getElementById('headless-output') || null;
  return node !== null ? write : noop;

  function write(message) {
    const text = document.createTextNode(message + '\n');
    node.appendChild(text);
  }
})();

const originalHandleError = window.onerror;
window.onerror = handleError;

if (typeof process === 'undefined') {
  window.process = {};
}

process.stdout = createStream();
process.stderr = createStream();
process.exit = function () { ws.end(); };

if (typeof console === 'undefined') {
  window.console = {};
}

const originalConsoleLog = console.log || noop;
console.log = consoleLog;

// -

function noop() {}

function createStream() {
  const s = new Stream();

  s.writable = true;
  s.write = function (data) {
    ws.write(String(data));
  };

  return s;
}

function consoleLog(message) {
  var index = 1;
  var args = arguments;

  if (typeof message === 'string') {
    message = message.replace(/(^|[^%])%[sd]/g, function (_, s) {
      return s + args[index++];
    });
  } else {
    message = inspect(message);
  }

  for (var i = index; i < args.length; ++i) {
    message += ' ' + inspect(args[i]);
  }

  ws.write(message + '\n');

  documentWrite(message);
  originalConsoleLog.apply(this, arguments);
}

function handleError(msg, url, lineNo, columnNo, error) {
  var errorType = error && error.name || 'Error';
  var errorMessage = error && error.message || msg;
  var message = (error ? errorType + ': ' : '') + errorMessage
    + ' on line ' + lineNo + (columnNo ? ':' + columnNo : '');

  ws.write(message + '\n');

  if (error && error.stack) {
    const lines = error.stack.split('\n').slice(1);
    lines.forEach(function (line) {
      ws.write('  ' + line.replace(url, '').trim() + '\n');
    });
  }

  if (typeof originalHandleError === 'function') {
    return originalHandleError.apply(this, arguments);
  }

  return false;
}
