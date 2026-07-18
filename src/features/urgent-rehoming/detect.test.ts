import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectUrgentRehomingReason } from './detect.js';

void test('flags blocked crosspost sources before text analysis', () => {
  assert.equal(
    detectUrgentRehomingReason({
      title: 'Normal post',
      body: '',
      blockedCrosspost: true,
    }),
    'blocked_crosspost_source'
  );
});

void test('detects urgent transfer language', () => {
  assert.equal(
    detectUrgentRehomingReason({
      title: 'Urgent foster needed',
      body: 'Please share, this dog needs placement today.',
      blockedCrosspost: false,
    }),
    'urgent_transfer_terms'
  );
});

void test('detects urgent shelter context without transfer language', () => {
  assert.equal(
    detectUrgentRehomingReason({
      title: 'Deadline at animal shelter',
      body: 'Shelter ID A123456',
      blockedCrosspost: false,
    }),
    'urgent_shelter_terms'
  );
});

void test('does not flag medical euthanasia without shelter context', () => {
  assert.equal(
    detectUrgentRehomingReason({
      title: 'Saying goodbye',
      body: 'Our vet recommended euthanasia after a long illness.',
      blockedCrosspost: false,
    }),
    null
  );
});
