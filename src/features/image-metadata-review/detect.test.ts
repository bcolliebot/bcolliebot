import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  analyzeImageMetadataBytes,
  collectImageCandidateUrls,
  isLikelyImagePost,
} from './detect.js';

function asciiBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

void test('collects unique image candidate URLs from gallery and post URL', () => {
  assert.deepEqual(
    collectImageCandidateUrls({
      url: 'https://i.redd.it/post.jpg',
      gallery: [
        { url: 'https://preview.redd.it/one.png?width=640&amp;format=png' },
        { url: 'https://preview.redd.it/one.png?width=640&amp;format=png' },
        { url: 'https://example.com/not-image.html' },
      ],
    }),
    [
      'https://preview.redd.it/one.png?width=640&format=png',
      'https://i.redd.it/post.jpg',
    ]
  );
});

void test('recognizes likely image posts from candidate URLs', () => {
  assert.equal(isLikelyImagePost({ url: 'https://example.com/photo.jpeg' }), true);
  assert.equal(isLikelyImagePost({ url: 'https://example.com/post' }), false);
});

void test('finds AI metadata terms in extracted image bytes', () => {
  assert.deepEqual(
    analyzeImageMetadataBytes(asciiBytes('created with Stable Diffusion and Content Credentials')),
    ['metadata_term:stable diffusion', 'metadata_term:content credentials', 'c2pa_marker', 'c2pa_plus_ai_term']
  );
});
