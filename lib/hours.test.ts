// Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusAt, fmtTime, toMin, zonedNow } from './hours.ts';

const wk = [...Array(7)].map((_, i) => ({ day: 'D' + i, open: '15:00', close: '23:00' }));

test('open / closed during a normal day', () => {
  assert.equal(statusAt(wk, 1, toMin('16:00')).open, true);
  assert.deepEqual(statusAt(wk, 1, toMin('10:00')), { open: false, when: 'today', at: '15:00' });
  assert.deepEqual(statusAt(wk, 1, toMin('23:30')), { open: false, when: 'tomorrow', at: '15:00' });
});

test('closing after midnight carries into the next day', () => {
  const late = wk.map((d) => ({ ...d, close: '01:00' }));
  assert.deepEqual(statusAt(late, 2, toMin('00:30')), { open: true, closes: '01:00' });
  assert.equal(statusAt(late, 2, toMin('01:30')).open, false);
});

test('skips closed days', () => {
  const shut = wk.map((d, i) => (i === 2 ? { ...d, open: null, close: null } : d));
  assert.deepEqual(statusAt(shut, 1, toMin('23:30')), { open: false, when: 'on D3', at: '15:00' });
});

test('time formatting', () => {
  assert.equal(fmtTime('15:00'), '3 PM');
  assert.equal(fmtTime('00:00'), '12 AM');
  assert.equal(fmtTime('21:30'), '9:30 PM');
});

test('Manila time ignores visitor timezone', () => {
  // 2026-10-11T07:30Z is 15:30 Sunday in Manila (UTC+8)
  assert.deepEqual(zonedNow('Asia/Manila', new Date('2026-10-11T07:30:00Z')), { day: 0, mins: 15 * 60 + 30 });
});
