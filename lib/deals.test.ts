// Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dealState, manilaToday } from './supabase.ts';

test('deal state follows the on/off switch and dates (inclusive)', () => {
  const t = '2026-10-11';
  assert.equal(dealState({ active: false, starts_on: null, ends_on: null }, t), 'paused');
  assert.equal(dealState({ active: true, starts_on: '2026-10-12', ends_on: null }, t), 'scheduled');
  assert.equal(dealState({ active: true, starts_on: null, ends_on: '2026-10-10' }, t), 'ended');
  assert.equal(dealState({ active: true, starts_on: t, ends_on: t }, t), 'live');
});

test('today is computed in Manila time', () => {
  assert.equal(manilaToday(new Date('2026-10-11T17:00:00Z')), '2026-10-12'); // 1 AM in Manila
});
