import assert from 'assert';
import { validateApplicationPayload, checkAndRecordSubmission, resetSubmissionMap } from '../src/validators/initiative';

function shouldThrow(fn: () => any, msgContains?: string) {
  try { fn(); } catch (e: any) { if (!msgContains || String(e.message).includes(msgContains)) return; throw e; }
  throw new Error('Expected function to throw');
}

// Valid payload
const valid = {
  name: 'Alice Example',
  email: 'alice@example.com',
  githubUsername: 'alice',
  linkedinUrl: 'https://linkedin.com/in/alice',
  websiteUrl: 'https://alice.dev',
  contributionAreas: ['engineering','documentation'],
  experienceLevel: 'Intermediate',
  availability: '1-3 hours/week',
  contributionTypes: ['Fix issues'],
  motivation: 'I want to help.'
};

// Tests
(function run() {
  // validate success
  const c = validateApplicationPayload(valid);
  assert.strictEqual(c.name, 'Alice Example');
  assert.strictEqual(c.email, 'alice@example.com');

  // missing name
  shouldThrow(() => validateApplicationPayload({ ...valid, name: '' }), 'Name is required');

  // invalid email
  shouldThrow(() => validateApplicationPayload({ ...valid, email: 'not-an-email' }), 'Valid email');

  // invalid contribution area
  shouldThrow(() => validateApplicationPayload({ ...valid, contributionAreas: ['notarealarea'] }), 'Invalid contribution area');

  // empty contribution array
  shouldThrow(() => validateApplicationPayload({ ...valid, contributionAreas: [] }), 'At least one contribution area');

  // invalid experience level
  shouldThrow(() => validateApplicationPayload({ ...valid, experienceLevel: 'Expert' }), 'Invalid experience level');

  // invalid availability
  shouldThrow(() => validateApplicationPayload({ ...valid, availability: 'All day' }), 'Invalid availability');

  // invalid url
  shouldThrow(() => validateApplicationPayload({ ...valid, websiteUrl: 'ftp://evil' }), 'Invalid URL');

  // too long motivation
  shouldThrow(() => validateApplicationPayload({ ...valid, motivation: 'a'.repeat(5000) }), 'Motivation too long');

  // client-supplied status should be rejected
  shouldThrow(() => validateApplicationPayload({ ...valid, status: 'accepted' }), 'Client may not set status');

  // rate limiter basic
  resetSubmissionMap();
  const ip = '1.2.3.4';
  for (let i=0;i<5;i++) checkAndRecordSubmission(ip, 1000*i);
  // 6th within window should throw
  shouldThrow(() => checkAndRecordSubmission(ip, 1000*6), 'Too many requests');

  console.log('All initiative validator tests passed');
})();
