import assert from 'assert';

import type { InitiativeApplication } from '../src/db/schema';
import {
  aggregateContributions,
  buildProfileFromAggregate,
  difficultyToPoints,
  hasHackRadarContributionSignal,
  getFellowshipContributorWithDeps,
  getFellowshipLeaderboardWithDeps,
  getPublicContributorsWithDeps,
  normalizeDifficultyLabel,
  normalizeGithubUsername,
  pickDifficultyFromLabels,
  recordMergedContributionWithDeps,
  sortLeaderboardEntries,
} from '../src/services/fellowship';

function makeApplication(overrides: Partial<InitiativeApplication> = {}): InitiativeApplication {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alice Example',
    email: 'alice@example.com',
    githubUsername: 'Alice',
    linkedinUrl: null,
    websiteUrl: null,
    interests: [],
    contributionAreas: ['frontend', 'documentation'],
    experienceLevel: 'Intermediate',
    availability: 'Flexible',
    contributionTypes: [],
    motivation: 'Helping out',
    status: 'pending',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

async function run() {
  assert.strictEqual(normalizeGithubUsername('  @Alice '), 'alice');
  assert.strictEqual(normalizeGithubUsername(''), null);

  assert.strictEqual(normalizeDifficultyLabel('difficulty: hard'), 'hard');
  assert.strictEqual(normalizeDifficultyLabel('Expert'), 'expert');
  assert.strictEqual(difficultyToPoints('easy'), 5);
  assert.strictEqual(difficultyToPoints('expert'), 50);
  assert.strictEqual(pickDifficultyFromLabels(['backend', 'difficulty: medium']), 'medium');

  const aggregates = aggregateContributions([
    {
      id: '1',
      repository: 'owner/repo',
      applicationId: 'app-1',
      githubUsername: 'alice',
      issueNumber: 1,
      linkedIssueNumbers: ['1'],
      prNumber: 10,
      prUrl: 'https://github.com/owner/repo/pull/10',
      difficulty: 'hard',
      points: 30,
      additions: 200,
      deletions: 50,
      mergedAt: new Date('2026-08-10T00:00:00.000Z'),
      createdAt: new Date('2026-08-10T00:00:00.000Z'),
    } as any,
    {
      id: '2',
      repository: 'owner/repo',
      applicationId: 'app-1',
      githubUsername: 'alice',
      issueNumber: 2,
      linkedIssueNumbers: ['2'],
      prNumber: 11,
      prUrl: 'https://github.com/owner/repo/pull/11',
      difficulty: 'expert',
      points: 50,
      additions: 100,
      deletions: 20,
      mergedAt: new Date('2026-08-11T00:00:00.000Z'),
      createdAt: new Date('2026-08-11T00:00:00.000Z'),
    } as any,
  ]);

  const aggregate = aggregates.get('alice');
  assert.ok(aggregate);
  assert.strictEqual(aggregate?.points, 80);
  assert.strictEqual(aggregate?.hard, 1);
  assert.strictEqual(aggregate?.expert, 1);

  const profile = buildProfileFromAggregate('alice', aggregate, makeApplication(), undefined, null);
  assert.ok(profile);
  assert.strictEqual(profile?.isFellowshipMember, true);
  assert.strictEqual(profile?.displayName, 'alice');
  assert.strictEqual(profile?.points, 80);
  assert.strictEqual((profile as Record<string, unknown>).email, undefined);
  assert.strictEqual((profile as Record<string, unknown>).motivation, undefined);
  assert.strictEqual((profile as Record<string, unknown>).availability, undefined);
  assert.strictEqual((profile as Record<string, unknown>).linkedinUrl, undefined);
  assert.strictEqual((profile as Record<string, unknown>).websiteUrl, undefined);

  const sorted = sortLeaderboardEntries([
    {
      githubUsername: 'beta',
      displayName: 'Beta',
      avatarUrl: '',
      profileUrl: '',
      points: 100,
      mergedPrs: 2,
      easy: 1,
      medium: 0,
      hard: 1,
      expert: 0,
      additions: 10,
      deletions: 2,
      loc: 12,
      contributionAreas: [],
      firstAwardedAt: '2026-08-12T00:00:00.000Z',
      lastAwardedAt: '2026-08-12T00:00:00.000Z',
    },
    {
      githubUsername: 'alpha',
      displayName: 'Alpha',
      avatarUrl: '',
      profileUrl: '',
      points: 100,
      mergedPrs: 3,
      easy: 0,
      medium: 1,
      hard: 1,
      expert: 0,
      additions: 20,
      deletions: 4,
      loc: 24,
      contributionAreas: [],
      firstAwardedAt: '2026-08-11T00:00:00.000Z',
      lastAwardedAt: '2026-08-11T00:00:00.000Z',
    },
  ]);
  assert.strictEqual(sorted[0].githubUsername, 'alpha');

  const insertedRows: any[] = [];
  const recordResult = await recordMergedContributionWithDeps(
    {
      repository: 'owner/repo',
      prNumber: 42,
      prUrl: 'https://github.com/owner/repo/pull/42',
      githubUsername: 'alice',
      issueNumber: 7,
      linkedIssueNumbers: [7],
      issueLabels: ['frontend', 'difficulty: medium'],
      issueBody: '<!-- hackradar-track: frontend -->',
      mergedAt: '2026-08-14T00:00:00.000Z',
      additions: 33,
      deletions: 11,
    },
    {
      applications: [makeApplication()],
      insertContribution: async (row) => {
        insertedRows.push(row);
        return insertedRows.length === 1 ? [{ id: 'row-1', ...row }] as any : [];
      },
    },
  );
  assert.strictEqual(recordResult.recorded, true);
  assert.strictEqual(recordResult.duplicate, false);
  assert.strictEqual(insertedRows[0].points, 15);

  const fallbackDifficultyResult = await recordMergedContributionWithDeps(
    {
      repository: 'owner/repo',
      prNumber: 43,
      prUrl: 'https://github.com/owner/repo/pull/43',
      githubUsername: 'alice',
      issueNumber: 7,
      linkedIssueNumbers: [7],
      issueLabels: ['frontend'],
      issueBody: '<!-- hackradar-track: frontend -->',
      mergedAt: '2026-08-14T00:00:00.000Z',
      additions: 1,
      deletions: 1,
    },
    {
      applications: [makeApplication()],
      insertContribution: async (row) => [{ id: 'row-2', ...row }] as any,
    },
  );
  assert.strictEqual(fallbackDifficultyResult.recorded, true);

  const duplicateResult = await recordMergedContributionWithDeps(
    {
      repository: 'owner/repo',
      prNumber: 42,
      prUrl: 'https://github.com/owner/repo/pull/42',
      githubUsername: 'alice',
      issueNumber: 7,
      linkedIssueNumbers: [7],
      issueLabels: ['frontend', 'difficulty: medium'],
      issueBody: '<!-- hackradar-track: frontend -->',
      mergedAt: '2026-08-14T00:00:00.000Z',
      additions: 33,
      deletions: 11,
    },
    {
      applications: [makeApplication()],
      insertContribution: async () => [],
    },
  );
  assert.strictEqual(duplicateResult.recorded, false);
  assert.strictEqual(duplicateResult.duplicate, true);

  const publicContributors = await getPublicContributorsWithDeps({
    loadApplications: async () => [makeApplication()],
    loadContributions: async () => [
      {
        id: '3',
        repository: 'owner/repo',
        applicationId: 'app-1',
        githubUsername: 'alice',
        issueNumber: 3,
        linkedIssueNumbers: ['3'],
        prNumber: 12,
        prUrl: 'https://github.com/owner/repo/pull/12',
        difficulty: 'medium',
        points: 15,
        additions: 5,
        deletions: 2,
        mergedAt: new Date('2026-08-12T00:00:00.000Z'),
        createdAt: new Date('2026-08-12T00:00:00.000Z'),
      } as any,
    ],
    listRepositoryContributors: async () => [
      { login: 'alice', avatar_url: 'https://example.com/alice.png', html_url: 'https://github.com/alice', contributions: 4 } as any,
      { login: 'bob', avatar_url: 'https://example.com/bob.png', html_url: 'https://github.com/bob', contributions: 7 } as any,
    ],
    loadGithubUser: async () => null,
  });
  assert.strictEqual(publicContributors.length, 2);
  assert.strictEqual(publicContributors[0].githubUsername, 'bob');
  assert.strictEqual(publicContributors[0].isFellowshipMember, false);
  assert.strictEqual(publicContributors[1].githubUsername, 'alice');
  assert.strictEqual(publicContributors[1].isFellowshipMember, true);
  assert.strictEqual((publicContributors[1] as Record<string, unknown>).email, undefined);
  assert.strictEqual((publicContributors[1] as Record<string, unknown>).motivation, undefined);

  const leaderboard = await getFellowshipLeaderboardWithDeps({
    loadApplications: async () => [makeApplication()],
    loadContributions: async () => [
      {
        id: '4',
        repository: 'owner/repo',
        applicationId: 'app-1',
        githubUsername: 'alice',
        issueNumber: 4,
        linkedIssueNumbers: ['4'],
        prNumber: 13,
        prUrl: 'https://github.com/owner/repo/pull/13',
        difficulty: 'hard',
        points: 30,
        additions: 20,
        deletions: 10,
        mergedAt: new Date('2026-08-13T00:00:00.000Z'),
        createdAt: new Date('2026-08-13T00:00:00.000Z'),
      } as any,
    ],
    listRepositoryContributors: async () => [
      { login: 'alice', avatar_url: 'https://example.com/alice.png', html_url: 'https://github.com/alice', contributions: 4 } as any,
    ],
    loadGithubUser: async () => null,
  });
  assert.strictEqual(leaderboard.length, 1);
  assert.strictEqual(leaderboard[0].githubUsername, 'alice');
  assert.strictEqual(leaderboard[0].rank, 1);
  assert.strictEqual(leaderboard[0].points, 30);

  const nonMemberLeaderboard = await getFellowshipLeaderboardWithDeps({
    loadApplications: async () => [],
    loadContributions: async () => [
      {
        id: '5',
        repository: 'owner/repo',
        applicationId: 'app-1',
        githubUsername: 'charlie',
        issueNumber: 5,
        linkedIssueNumbers: ['5'],
        prNumber: 14,
        prUrl: 'https://github.com/owner/repo/pull/14',
        difficulty: 'expert',
        points: 50,
        additions: 40,
        deletions: 20,
        mergedAt: new Date('2026-08-14T00:00:00.000Z'),
        createdAt: new Date('2026-08-14T00:00:00.000Z'),
      } as any,
    ],
    listRepositoryContributors: async () => [],
    loadGithubUser: async () => null,
  });
  assert.strictEqual(nonMemberLeaderboard.length, 0);

  const contributorProfile = await getFellowshipContributorWithDeps('alice', {
    loadApplications: async () => [makeApplication()],
    loadContributions: async () => [
      {
        id: '6',
        repository: 'owner/repo',
        applicationId: 'app-1',
        githubUsername: 'alice',
        issueNumber: 6,
        linkedIssueNumbers: ['6'],
        prNumber: 15,
        prUrl: 'https://github.com/owner/repo/pull/15',
        difficulty: 'expert',
        points: 50,
        additions: 100,
        deletions: 25,
        mergedAt: new Date('2026-08-14T00:00:00.000Z'),
        createdAt: new Date('2026-08-14T00:00:00.000Z'),
      } as any,
    ],
    listRepositoryContributors: async () => [
      { login: 'alice', avatar_url: 'https://example.com/alice.png', html_url: 'https://github.com/alice', contributions: 4 } as any,
    ],
    loadGithubUser: async () => null,
  });
  assert.ok(contributorProfile);
  assert.strictEqual(contributorProfile?.githubUsername, 'alice');
  assert.strictEqual(contributorProfile?.isFellowshipMember, true);
  assert.strictEqual(contributorProfile?.points, 50);
  assert.strictEqual((contributorProfile as Record<string, unknown>).email, undefined);
  assert.strictEqual((contributorProfile as Record<string, unknown>).motivation, undefined);
  assert.strictEqual((contributorProfile as Record<string, unknown>).availability, undefined);

  assert.strictEqual(hasHackRadarContributionSignal(['frontend'], 'anything'), true);
  assert.strictEqual(hasHackRadarContributionSignal(['misc'], 'plain text'), false);

  console.log('Fellowship backend tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
