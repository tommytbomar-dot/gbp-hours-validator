'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { validate, parseRange } = require('../lib/validate');

test('clean week passes', () => {
  const r = validate({ mon: '9am-5pm', tue: '9am-5pm', wed: '9am-5pm', thu: '9am-5pm', fri: '9am-5pm', sat: 'closed', sun: 'closed' });
  assert.equal(r.ok, true); assert.equal(r.warnings.length, 0);
  assert.deepEqual(r.normalized.mon, ['09:00-17:00']);
});
test('overlap is an error', () => {
  const r = validate({ mon: ['9am-1pm', '12pm-5pm'] });
  assert.equal(r.ok, false); assert.match(r.errors[0], /overlapping/);
});
test('zero-length range is an error', () => {
  assert.equal(validate({ mon: '9am-9am' }).ok, false);
});
test('missing days warn', () => {
  const r = validate({ mon: '9am-5pm' });
  assert.ok(r.warnings.some((w) => /no hours given/.test(w)));
});
test('ambiguous 9-5 gets assumption warning', () => {
  const r = parseRange('9-5');
  assert.equal(r.open, 540); assert.equal(r.close, 1020); assert.ok(r.notes.length);
});
test('overnight is accepted with warning', () => {
  const r = validate({ fri: '6pm-2am' });
  assert.equal(r.ok, true); assert.ok(r.warnings.some((w) => /midnight/.test(w)));
});
test('text format parses and split shifts work', () => {
  const r = validate('Mon: 8am-12pm, 1pm-5pm\nTue 09:00-17:00\nSun: Closed');
  assert.equal(r.ok, true); assert.deepEqual(r.normalized.mon, ['08:00-12:00', '13:00-17:00']); assert.equal(r.normalized.sun, 'closed');
});
test('garbage times error', () => {
  assert.equal(validate({ mon: '25pm-9pm' }).ok, false);
  assert.equal(validate({ mon: 'whenever' }).ok, false);
});
test('24 hours', () => {
  const r = validate({ mon: '24 hours' }); assert.deepEqual(r.normalized.mon, ['00:00-24:00']);
});
