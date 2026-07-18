import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SIGNATURE } from '../breed-id/text.js';
import {
  DEFAULT_APPEARANCE_RESPONSE_INTRO,
  DEFAULT_VET_RESPONSE_TEXT,
  buildAppearanceResponse,
  buildVetResponse,
} from './text.js';

void test('builds appearance response from configured intro and breed ID guidance', () => {
  assert.equal(
    buildAppearanceResponse('Configured appearance intro', 'Configured guidance'),
    `Configured appearance intro\n\nConfigured guidance${SIGNATURE}`
  );
});

void test('builds vet response from configured text and signature', () => {
  assert.equal(
    buildVetResponse('Configured vet text'),
    `Configured vet text${SIGNATURE}`
  );
});

void test('default summon text references bcollie-modbot', () => {
  assert.match(DEFAULT_APPEARANCE_RESPONSE_INTRO, /^bcollie-modbot has been summoned/);
  assert.match(DEFAULT_VET_RESPONSE_TEXT, /^bcollie-modbot has been summoned/);
});
