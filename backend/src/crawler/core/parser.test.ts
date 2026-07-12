import test from 'node:test';
import assert from 'node:assert/strict';

import { Parser } from './parser';
import { Validator } from './validator';
import { normalize } from '../../pipeline/normalizer';

test('parser filters login, pricing, docs, blog and footer links from listing pages', () => {
  const parser = new Parser();
  const html = `
    <html>
      <body>
        <nav>
          <a href="/pricing">Pricing</a>
          <a href="/docs/getting-started">Docs</a>
        </nav>
        <main>
          <a href="https://example.com/hackathons/ai-accelerator" title="AI Accelerator Hackathon">AI Accelerator Hackathon</a>
          <a href="https://example.com/login">Login</a>
          <a href="https://example.com/blog/announcing-hackathon">Blog post</a>
        </main>
        <footer>
          <a href="https://example.com/contact">Contact</a>
        </footer>
      </body>
    </html>
  `;

  const items = parser.parseHtml(html, 'devpost');

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, 'AI Accelerator Hackathon');
  assert.equal(items[0]?.sourceUrl, 'https://example.com/hackathons/ai-accelerator');
});

test('parser rejects dashboard, profile, blog, guide, organizer and host landing pages', () => {
  const parser = new Parser();
  const html = `
    <html>
      <body>
        <main>
          <a href="https://example.com/dashboard">Your hackathons</a>
          <a href="https://example.com/profile/alice">Alice's profile</a>
          <a href="https://example.com/guides/how-to-start">How to start</a>
          <a href="https://example.com/organizers">Organizers</a>
          <a href="https://example.com/host-a-hackathon">Host a Hackathon</a>
          <a href="https://example.com/hackathons/ai-accelerator" title="AI Accelerator Hackathon">AI Accelerator Hackathon</a>
        </main>
      </body>
    </html>
  `;

  const items = parser.parseHtml(html, 'devpost');

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, 'AI Accelerator Hackathon');
});

test('normalizer cleans noisy titles and formats participant counts into descriptions', () => {
  const normalized = normalize({
    title: 'View Save this event Tomorrow at 6:00 PM • AI Buildathon',
    description: 'Join the buildathon for builders in New York. Online and in person.',
    sourceUrl: 'https://example.com/hackathons/ai-buildathon',
    sourceId: 'ai-buildathon',
    source: 'devpost',
    locationText: 'New York, USA',
    participantCount: 496,
    rawData: {},
  });

  assert.equal(normalized.title, 'AI Buildathon');
  assert.match(normalized.description ?? '', /496 participants/i);
  assert.match(normalized.description ?? '', /Online|Hybrid|In-person/i);
  assert.equal(normalized.prizeDescription, null);
});

test('validator rejects placeholder titles and incomplete records', () => {
  const validator = new Validator();
  const raw = {
    title: 'Hackathon',
    description: '',
    sourceUrl: 'https://example.com/event',
    sourceId: 'event-1',
    source: 'devpost' as const,
    rawData: {},
  };

  const issues = validator.validate(raw);
  assert.ok(issues.some((issue) => issue.reason.includes('placeholder') || issue.reason.includes('insufficient')));
});
