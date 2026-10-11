// Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONTENT, mergeContent, phoneHref, phoneIntl } from './content.ts';

test('blank or missing admin fields fall back to the defaults', () => {
  const c = mergeContent(DEFAULT_CONTENT, { hero: { title: '  ', subtitle: 'New subtitle' }, reviews: { items: [] } });
  assert.equal(c.hero.title, DEFAULT_CONTENT.hero.title);
  assert.equal(c.hero.subtitle, 'New subtitle');
  assert.equal(c.hero.image.src, DEFAULT_CONTENT.hero.image.src);
  assert.deepEqual(c.reviews.items, DEFAULT_CONTENT.reviews.items);
  assert.deepEqual(mergeContent(DEFAULT_CONTENT, null), DEFAULT_CONTENT);
});

test('saved lists replace the defaults; blank list entries are dropped', () => {
  const c = mergeContent(DEFAULT_CONTENT, { reviews: { items: [{ quote: 'Lovely!', source: '' }] }, contact: { services: ['Dine-in', ' '] } });
  assert.deepEqual(c.reviews.items, [{ quote: 'Lovely!', source: DEFAULT_CONTENT.reviews.items[0].source }]);
  assert.deepEqual(c.contact.services, ['Dine-in']);
});

test('phone formats', () => {
  assert.equal(phoneHref('0906 508 1467'), 'tel:+639065081467');
  assert.equal(phoneIntl('0906 508 1467'), '+63-906-508-1467');
});
