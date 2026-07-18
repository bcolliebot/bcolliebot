import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectBreedIdIntent,
  isLikelyImagePost,
  isWrongFeedbackComment,
  normalizeText,
} from './detect.js';

void test('normalizes punctuation and whitespace for phrase matching', () => {
  assert.equal(normalizeText('Is this a Border-Collie   mix?'), 'is this a border collie mix');
});

void test('detects likely breed ID posts from title, breed, mix, and image signals', () => {
  assert.deepEqual(
    detectBreedIdIntent({
      title: 'Is my dog a border collie mix?',
      body: '',
      url: 'https://i.redd.it/example.jpg',
    }),
    { matched: true, score: 8 }
  );
});

void test('does not match ordinary border collie posts without ID intent', () => {
  assert.deepEqual(
    detectBreedIdIntent({
      title: 'My border collie loved the beach today',
      body: '',
      url: 'https://i.redd.it/example.jpg',
    }),
    { matched: false, score: 3 }
  );
});

void test('recognizes likely image URLs used by Reddit and direct images', () => {
  assert.equal(isLikelyImagePost('https://preview.redd.it/example'), true);
  assert.equal(isLikelyImagePost('https://example.com/photo.webp'), true);
  assert.equal(isLikelyImagePost('https://example.com/page.html'), false);
});

void test('detects wrong feedback while ignoring negated wrong text', () => {
  assert.equal(isWrongFeedbackComment('!wrong'), true);
  assert.equal(isWrongFeedbackComment('wrong post'), true);
  assert.equal(isWrongFeedbackComment('this is not wrong'), false);
});
