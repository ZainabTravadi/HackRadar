require('dotenv').config({ path: '.env' });
const fetchFn = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

(async () => {
  const url = process.env.API_URL || `http://localhost:${process.env.API_PORT || 3001}/api/initiative/applications`;
  const payload = {
    name: 'Automated Test User',
    email: 'test+hackradar@example.com',
    githubUsername: 'testuser',
    linkedinUrl: null,
    websiteUrl: null,
    interests: ['testing', 'docs'],
    contributionAreas: ['documentation'],
    experienceLevel: 'Intermediate',
    availability: 'Flexible / varies',
    contributionTypes: ['documentation'],
    motivation: 'Automated test submission to verify integration.'
  };

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    console.log('response_status', res.status);
    console.log('response_body', JSON.stringify(body));
    if (body && body.applicationId) {
      console.log('applicationId', body.applicationId);
    }
    process.exit(0);
  } catch (err) {
    console.error('POST failed:', err.message || err);
    process.exit(2);
  }
})();
