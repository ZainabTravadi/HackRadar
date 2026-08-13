import 'dotenv/config';
import assert from 'assert';
import { buildInitiativeApplicationEmail } from '../src/services/initiativeApplications';
import type { InitiativeApplication } from '../src/db/schema';

const application = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Alice Example',
  email: 'alice@example.com',
  githubUsername: 'alice',
  linkedinUrl: 'https://linkedin.com/in/alice',
  websiteUrl: 'https://alice.dev',
  interests: ['community', 'testing'],
  contributionAreas: ['engineering', 'documentation'],
  experienceLevel: 'Intermediate',
  availability: '3-5 hours/week',
  contributionTypes: ['bug fixes', 'reviews'],
  motivation: 'I want to help.',
  status: 'pending',
  createdAt: new Date('2026-08-13T00:00:00.000Z'),
  updatedAt: new Date('2026-08-13T00:00:00.000Z'),
} as InitiativeApplication;

const message = buildInitiativeApplicationEmail(application);

assert.match(message.subject, /Alice Example/);
assert.match(message.text, /Application ID: 11111111-1111-1111-1111-111111111111/);
assert.match(message.text, /Contribution areas: engineering, documentation/);
assert.match(message.text, /Interests: community, testing/);
assert.match(message.text, /Motivation:/);

console.log('Initiative email formatting tests passed');
