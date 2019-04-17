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
