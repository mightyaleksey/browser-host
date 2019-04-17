const test = require('tape');

test('fetch weather', async (t) => {
  t.plan(2);

  window.fetch('/mock/weather')
    .then(r => {
      t.equal(r.status, 200);
      return r.json();
    })
    .then(r => t.deepEqual(r, { weather: 'is ok' }))
    .catch(e => t.fail(e));
});
