import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_BREED_ID_AUTO_CAVEAT,
  DEFAULT_BREED_ID_AUTO_INTRO,
  DEFAULT_BREED_ID_CORE_TEXT,
  SIGNATURE,
  buildBreedIdAutoResponse,
} from './text.js';

void test('builds breed ID auto response from configured text and signature', () => {
  const response = buildBreedIdAutoResponse('Intro text', 'Core text', 'Caveat text');

  assert.equal(response, `Intro text\n\nCore text\n\nCaveat text${SIGNATURE}`);
});

void test('default breed ID response text uses bcollie-modbot command page link', () => {
  const response = buildBreedIdAutoResponse(
    DEFAULT_BREED_ID_AUTO_INTRO,
    DEFAULT_BREED_ID_CORE_TEXT,
    DEFAULT_BREED_ID_AUTO_CAVEAT
  );

  assert.match(response, /^bcollie-modbot thinks this post may be asking/);
  assert.match(response, /https:\/\/bcolliebot\.github\.io\/bcolliebot\/commands\.html/);
});
