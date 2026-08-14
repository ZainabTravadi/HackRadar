import { desc } from 'drizzle-orm';

import { db } from '../db';
import {
  fellowshipContributions,
  initiativeApplications,
  type FellowshipContribution,
  type InitiativeApplication,
} from '../db/schema';

export type ContributionDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTY_POINTS: Record<ContributionDifficulty, number> = {
  easy: 5,
  medium: 15,
  hard: 30,
  expert: 50,
};

const TRACK_LABELS = new Set([
  'frontend',
  'backend',
  'crawler',
  'data',
  'design',
  'documentation',
  'community',
  'testing',
  'accessibility',
  'bug',
  'enhancement',
  'hackradar fellowship',
]);

const GITHUB_API_BASE = process.env.GITHUB_API_URL || 'https://api.github.com';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

type CachedValue<T> = {
  value: T;
  expiresAt: number;
};

type GitHubContributor = {
  login?: string;
  id?: number;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
  type?: string;
};

type GitHubUser = {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  type?: string;
};

type ContributionAggregate = {
  applicationId: string;
  githubUsername: string;
  points: number;
  mergedPrs: number;
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  additions: number;
  deletions: number;
  firstAwardedAt: Date;
  lastAwardedAt: Date;
  issueNumbers: Set<number>;
  prNumbers: Set<number>;
};

type CommunityDataDeps = {
  loadApplications: () => Promise<InitiativeApplication[]>;
  loadContributions: () => Promise<FellowshipContribution[]>;
  listRepositoryContributors: () => Promise<GitHubContributor[]>;
  loadGithubUser: (login: string) => Promise<GitHubUser | null>;
};

export type PublicContributor = {
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
  mergedPrs: number;
  isFellowshipMember: boolean;
  contributionAreas: string[];
  points?: number;
  rank?: number;
};

export type FellowshipLeaderboardEntry = {
  rank: number;
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  points: number;
  mergedPrs: number;
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  additions: number;
  deletions: number;
  loc: number;
  contributionAreas: string[];
  firstAwardedAt: string;
  lastAwardedAt: string;
};

export type ContributorProfile = {
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
  mergedPrs: number;
  isFellowshipMember: boolean;
  points?: number;
  rank?: number;
  easy?: number;
  medium?: number;
  hard?: number;
  expert?: number;
  additions?: number;
  deletions?: number;
  loc?: number;
  contributionAreas: string[];
};

export type RecordContributionInput = {
  repository: string;
  prNumber: number;
  prUrl: string;
  githubUsername: string;
  issueNumber: number;
  linkedIssueNumbers?: number[];
  issueLabels?: string[];
  issueBody?: string | null;
  mergedAt: string;
  additions?: number;
  deletions?: number;
};

export type RecordContributionResult =
  | { recorded: true; duplicate: false; contribution: FellowshipContribution }
  | { recorded: false; duplicate: true }
  | { recorded: false; duplicate: false; reason: string };

const githubCache = new Map<string, CachedValue<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = githubCache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    githubCache.delete(key);
    return null;
  }

  return entry.value as T;
}

function cacheSet<T>(key: string, value: T, ttlMs: number) {
  githubCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function normalizeGithubUsername(value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim().replace(/^@+/, '');
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase();
}

export function difficultyToPoints(difficulty: ContributionDifficulty): number {
  return DIFFICULTY_POINTS[difficulty];
}

export function normalizeDifficultyLabel(value: string | null | undefined): ContributionDifficulty | null {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
    .trim();

  if (!normalized) {
    return null;
  }

  if (normalized === 'difficulty easy' || normalized === 'easy' || normalized === 'difficulty: easy') {
    return 'easy';
  }
  if (normalized === 'difficulty medium' || normalized === 'medium' || normalized === 'difficulty: medium') {
    return 'medium';
  }
  if (normalized === 'difficulty hard' || normalized === 'hard' || normalized === 'difficulty: hard') {
    return 'hard';
  }
  if (normalized === 'difficulty expert' || normalized === 'expert' || normalized === 'difficulty: expert') {
    return 'expert';
  }

  const match = normalized.match(/difficulty\s*:?\s*(easy|medium|hard|expert)/);
  return (match?.[1] as ContributionDifficulty | undefined) ?? null;
}

export function pickDifficultyFromLabels(labels: Array<string | { name?: string } | null | undefined>): ContributionDifficulty | null {
  for (const label of labels) {
    const name = typeof label === 'string' ? label : label?.name;
    const normalized = normalizeDifficultyLabel(name);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeLabelName(value: string | null | undefined): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function issueLooksLikeHackRadar(labels: Array<string | { name?: string } | null | undefined>, body?: string | null): boolean {
  for (const label of labels) {
    const name = typeof label === 'string' ? label : label?.name;
    if (TRACK_LABELS.has(normalizeLabelName(name))) {
      return true;
    }
  }

  return /hackradar-track:/i.test(String(body ?? '')) || /hackradar fellowship/i.test(String(body ?? ''));
}

function fallbackAvatar(username: string): string {
  return `https://github.com/${encodeURIComponent(username)}.png?size=160`;
}

function publicDisplayName(username: string, contributorInfo?: GitHubContributor, userInfo?: GitHubUser | null): string {
  return normalizeGithubUsername(contributorInfo?.login) || normalizeGithubUsername(userInfo?.login) || username;
}

async function githubRequest<T>(route: string): Promise<T> {
  if (!GITHUB_REPOSITORY && !route.startsWith('/users/')) {
    throw new Error('GITHUB_REPOSITORY is required for GitHub repository requests');
  }

  const url = route.startsWith('http') ? route : `${GITHUB_API_BASE}${route}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? String((payload as { message?: unknown }).message) : text || response.statusText;
    const error = new Error(`GitHub API request failed: ${response.status} ${message}`);
    (error as Error & { status?: number; body?: unknown }).status = response.status;
    (error as Error & { status?: number; body?: unknown }).body = payload || text;
    throw error;
  }

  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function listRepositoryContributors(): Promise<GitHubContributor[]> {
  if (!GITHUB_REPOSITORY) {
    return [];
  }

  const cacheKey = `contributors:${GITHUB_REPOSITORY}`;
  const cached = cacheGet<GitHubContributor[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const results: GitHubContributor[] = [];
    let page = 1;
    while (true) {
      const pageResults = await githubRequest<GitHubContributor[]>(`/repos/${GITHUB_REPOSITORY}/contributors?per_page=100&page=${page}&anon=1`);
      if (!Array.isArray(pageResults) || pageResults.length === 0) {
        break;
      }

      results.push(...pageResults);
      if (pageResults.length < 100) {
        break;
      }

      page += 1;
    }

    cacheSet(cacheKey, results, 5 * 60 * 1000);
    return results;
  } catch (error) {
    console.warn(`[HackRadar Fellowship] Unable to load repository contributors: ${(error as Error).message}`);
    cacheSet(cacheKey, [], 60 * 1000);
    return [];
  }
}

async function loadGithubUser(login: string): Promise<GitHubUser | null> {
  const normalized = normalizeGithubUsername(login);
  if (!normalized) {
    return null;
  }

  const cacheKey = `user:${normalized}`;
  const cached = cacheGet<GitHubUser | null>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const user = await githubRequest<GitHubUser>(`/users/${encodeURIComponent(normalized)}`);
    cacheSet(cacheKey, user, 60 * 60 * 1000);
    return user;
  } catch (error) {
    console.warn(`[HackRadar Fellowship] Unable to load GitHub user ${normalized}: ${(error as Error).message}`);
    cacheSet(cacheKey, null, 10 * 60 * 1000);
    return null;
  }
}

async function loadApplications(): Promise<InitiativeApplication[]> {
  return db.select().from(initiativeApplications);
}

async function loadContributions(): Promise<FellowshipContribution[]> {
  return db.select().from(fellowshipContributions).orderBy(desc(fellowshipContributions.mergedAt));
}

export function aggregateContributions(rows: FellowshipContribution[]) {
  const aggregates = new Map<string, ContributionAggregate>();

  for (const row of rows) {
    const key = normalizeGithubUsername(row.githubUsername);
    if (!key) {
      continue;
    }

    const mergedAt = row.mergedAt instanceof Date ? row.mergedAt : new Date(row.mergedAt);
    const current = aggregates.get(key) || {
      applicationId: row.applicationId,
      githubUsername: key,
      points: 0,
      mergedPrs: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
      additions: 0,
      deletions: 0,
      firstAwardedAt: mergedAt,
      lastAwardedAt: mergedAt,
      issueNumbers: new Set<number>(),
      prNumbers: new Set<number>(),
    };

    current.applicationId = row.applicationId;
    current.points += row.points;
    current.mergedPrs += 1;
    current[currentDifficultyKey(row.difficulty)] += 1;
    current.additions += row.additions || 0;
    current.deletions += row.deletions || 0;
    if (mergedAt < current.firstAwardedAt) {
      current.firstAwardedAt = mergedAt;
    }
    if (mergedAt > current.lastAwardedAt) {
      current.lastAwardedAt = mergedAt;
    }
    current.issueNumbers.add(row.issueNumber);
    current.prNumbers.add(row.prNumber);
    aggregates.set(key, current);
  }

  return aggregates;
}

function currentDifficultyKey(difficulty: string): 'easy' | 'medium' | 'hard' | 'expert' {
  return difficulty === 'medium' || difficulty === 'hard' || difficulty === 'expert' ? difficulty : 'easy';
}

export function buildProfileFromAggregate(
  username: string,
  aggregate: ContributionAggregate | undefined,
  application: InitiativeApplication | undefined,
  contributorInfo?: GitHubContributor,
  userInfo?: GitHubUser | null,
): ContributorProfile | null {
  if (!application) {
    return null;
  }

  const displayName = publicDisplayName(username, contributorInfo, userInfo);
  const profileUrl = contributorInfo?.html_url || userInfo?.html_url || `https://github.com/${encodeURIComponent(username)}`;
  const avatarUrl = contributorInfo?.avatar_url || userInfo?.avatar_url || fallbackAvatar(username);
  const totalContributions = contributorInfo?.contributions || aggregate?.mergedPrs || 0;
  const mergedPrs = aggregate?.mergedPrs || 0;
  const contributionAreas = Array.isArray(application.contributionAreas) ? application.contributionAreas.filter(Boolean) : [];

  return {
    githubUsername: username,
    displayName,
    avatarUrl,
    profileUrl,
    contributions: totalContributions,
    mergedPrs,
    isFellowshipMember: true,
    contributionAreas,
    points: aggregate?.points,
    easy: aggregate?.easy,
    medium: aggregate?.medium,
    hard: aggregate?.hard,
    expert: aggregate?.expert,
    additions: aggregate?.additions,
    deletions: aggregate?.deletions,
    loc: aggregate ? aggregate.additions + aggregate.deletions : undefined,
  };
}

export function sortLeaderboardEntries(entries: Omit<FellowshipLeaderboardEntry, 'rank'>[]): Omit<FellowshipLeaderboardEntry, 'rank'>[] {
  return [...entries].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    const rightHardExpert = right.hard + right.expert;
    const leftHardExpert = left.hard + left.expert;
    if (rightHardExpert !== leftHardExpert) {
      return rightHardExpert - leftHardExpert;
    }

    if (right.mergedPrs !== left.mergedPrs) {
      return right.mergedPrs - left.mergedPrs;
    }

    const leftFirst = new Date(left.firstAwardedAt).getTime();
    const rightFirst = new Date(right.firstAwardedAt).getTime();
    if (leftFirst !== rightFirst) {
      return leftFirst - rightFirst;
    }

    return left.githubUsername.localeCompare(right.githubUsername);
  });
}

export async function getPublicContributors(): Promise<PublicContributor[]> {
  return getPublicContributorsWithDeps({});
}

export async function getFellowshipLeaderboard(): Promise<FellowshipLeaderboardEntry[]> {
  return getFellowshipLeaderboardWithDeps({});
}

export async function getFellowshipContributor(username: string): Promise<ContributorProfile | null> {
  return getFellowshipContributorWithDeps(username, {});
}

export async function recordMergedContribution(input: RecordContributionInput): Promise<RecordContributionResult> {
  const applicationRows = await loadApplications();
  return recordMergedContributionWithDeps(input, {
    applications: applicationRows,
    insertContribution: async (row) =>
      db
        .insert(fellowshipContributions)
        .values(row)
        .onConflictDoNothing({ target: [fellowshipContributions.repository, fellowshipContributions.prNumber] })
        .returning(),
  });
}

export async function recordMergedContributionWithDeps(
  input: RecordContributionInput,
  deps: {
    applications: InitiativeApplication[];
    insertContribution: (row: {
      repository: string;
      applicationId: string;
      githubUsername: string;
      issueNumber: number;
      linkedIssueNumbers: string[];
      prNumber: number;
      prUrl: string;
      difficulty: ContributionDifficulty;
      points: number;
      additions: number;
      deletions: number;
      mergedAt: Date;
    }) => Promise<FellowshipContribution[]>;
  },
): Promise<RecordContributionResult> {
  const repository = String(input.repository || '').trim();
  const normalizedUsername = normalizeGithubUsername(input.githubUsername);
  const issueLabels = Array.isArray(input.issueLabels) ? input.issueLabels : [];
  const issueBody = input.issueBody ?? '';
  const mergedAt = new Date(input.mergedAt);
  const linkedIssueNumbers = uniqueNumberList(input.linkedIssueNumbers ?? []);
  const issueNumber = Number(input.issueNumber || linkedIssueNumbers[0] || 0);
  const prNumber = Number(input.prNumber || 0);

  if (!repository) {
    return { recorded: false, duplicate: false, reason: 'Missing repository' };
  }
  if (!Number.isFinite(prNumber) || prNumber <= 0) {
    return { recorded: false, duplicate: false, reason: 'Missing PR number' };
  }
  if (!Number.isFinite(issueNumber) || issueNumber <= 0) {
    return { recorded: false, duplicate: false, reason: 'Missing issue number' };
  }
  if (!normalizedUsername) {
    return { recorded: false, duplicate: false, reason: 'Missing GitHub username' };
  }
  if (Number.isNaN(mergedAt.getTime())) {
    return { recorded: false, duplicate: false, reason: 'Invalid merged timestamp' };
  }
  if (!issueLooksLikeHackRadar(issueLabels, issueBody)) {
    return { recorded: false, duplicate: false, reason: 'Issue is not a HackRadar contribution issue' };
  }

  const application = deps.applications.find((item) => normalizeGithubUsername(item.githubUsername) === normalizedUsername);
  if (!application) {
    return { recorded: false, duplicate: false, reason: 'GitHub username is not linked to a Fellowship application' };
  }

  const difficulty = pickDifficultyFromLabels(issueLabels) ?? 'easy';
  const points = difficultyToPoints(difficulty);
  const additions = Math.max(0, Math.trunc(Number(input.additions ?? 0)));
  const deletions = Math.max(0, Math.trunc(Number(input.deletions ?? 0)));
  const row = {
    repository,
    applicationId: application.id,
    githubUsername: normalizedUsername,
    issueNumber,
    linkedIssueNumbers: linkedIssueNumbers.map((value) => String(value)),
    prNumber,
    prUrl: String(input.prUrl || '').trim(),
    difficulty,
    points,
    additions,
    deletions,
    mergedAt,
  };

  if (!row.prUrl) {
    return { recorded: false, duplicate: false, reason: 'Missing PR URL' };
  }

  const inserted = await deps.insertContribution(row);

  if (inserted.length === 0) {
    return { recorded: false, duplicate: true };
  }

  return { recorded: true, duplicate: false, contribution: inserted[0] };
}

export async function getPublicContributorsWithDeps(deps: Partial<CommunityDataDeps>): Promise<PublicContributor[]> {
  const [contributors, applications, contributions] = await Promise.all([
    (deps.listRepositoryContributors ?? listRepositoryContributors)(),
    (deps.loadApplications ?? loadApplications)(),
    (deps.loadContributions ?? loadContributions)(),
  ]);

  const loadUser = deps.loadGithubUser ?? loadGithubUser;
  const applicationByUsername = new Map<string, InitiativeApplication>();
  for (const application of applications) {
    const username = normalizeGithubUsername(application.githubUsername);
    if (username && !applicationByUsername.has(username)) {
      applicationByUsername.set(username, application);
    }
  }

  const mergedByUsername = aggregateContributions(contributions);
  const contributorByUsername = new Map<string, GitHubContributor>();
  for (const contributor of contributors) {
    const username = normalizeGithubUsername(contributor.login);
    if (username && !contributorByUsername.has(username)) {
      contributorByUsername.set(username, contributor);
    }
  }

  const usernames = new Set<string>();
  for (const username of contributorByUsername.keys()) usernames.add(username);
  for (const username of mergedByUsername.keys()) usernames.add(username);

  const rows: PublicContributor[] = [];
  for (const username of usernames) {
    const application = applicationByUsername.get(username);
    const contributorInfo = contributorByUsername.get(username);
    const aggregate = mergedByUsername.get(username);
    const userInfo = contributorInfo ? null : await loadUser(username);
    const profile = buildProfileFromAggregate(username, aggregate, application, contributorInfo, userInfo);

    if (!profile) {
      rows.push({
        githubUsername: username,
        displayName: publicDisplayName(username, contributorInfo, userInfo),
        avatarUrl: userInfo?.avatar_url || fallbackAvatar(username),
        profileUrl: userInfo?.html_url || `https://github.com/${encodeURIComponent(username)}`,
        contributions: contributorInfo?.contributions || aggregate?.mergedPrs || 0,
        mergedPrs: aggregate?.mergedPrs || 0,
        isFellowshipMember: Boolean(application),
        contributionAreas: application?.contributionAreas?.filter(Boolean) ?? [],
      });
      continue;
    }

    rows.push({
      githubUsername: profile.githubUsername,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      contributions: profile.contributions,
      mergedPrs: profile.mergedPrs,
      isFellowshipMember: profile.isFellowshipMember,
      contributionAreas: profile.contributionAreas,
      points: profile.points,
      rank: profile.rank,
    });
  }

  rows.sort((left, right) => {
    if (right.contributions !== left.contributions) {
      return right.contributions - left.contributions;
    }

    if (right.mergedPrs !== left.mergedPrs) {
      return right.mergedPrs - left.mergedPrs;
    }

    return left.githubUsername.localeCompare(right.githubUsername);
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function getFellowshipLeaderboardWithDeps(deps: Partial<CommunityDataDeps>): Promise<FellowshipLeaderboardEntry[]> {
  const [applications, contributions] = await Promise.all([
    (deps.loadApplications ?? loadApplications)(),
    (deps.loadContributions ?? loadContributions)(),
  ]);

  const loadUser = deps.loadGithubUser ?? loadGithubUser;
  const repositoryContributors = await (deps.listRepositoryContributors ?? listRepositoryContributors)();
  const applicationByUsername = new Map<string, InitiativeApplication>();
  const repositoryContributorByUsername = new Map<string, GitHubContributor>();

  for (const application of applications) {
    const username = normalizeGithubUsername(application.githubUsername);
    if (username && !applicationByUsername.has(username)) {
      applicationByUsername.set(username, application);
    }
  }

  for (const contributor of repositoryContributors) {
    const username = normalizeGithubUsername(contributor.login);
    if (username && !repositoryContributorByUsername.has(username)) {
      repositoryContributorByUsername.set(username, contributor);
    }
  }

  const aggregateByUsername = aggregateContributions(contributions);
  const usernames = [...aggregateByUsername.keys()].filter((username) => applicationByUsername.has(username));

  const leaderboard = await Promise.all(
    usernames.map(async (username) => {
      const application = applicationByUsername.get(username);
      const aggregate = aggregateByUsername.get(username);
      if (!application || !aggregate) {
        return null;
      }

      const contributorInfo = repositoryContributorByUsername.get(username);
      const userInfo = contributorInfo ? null : await loadUser(username);
      const displayName = publicDisplayName(username, contributorInfo, userInfo);
      const avatarUrl = contributorInfo?.avatar_url || userInfo?.avatar_url || fallbackAvatar(username);
      const profileUrl = contributorInfo?.html_url || userInfo?.html_url || `https://github.com/${encodeURIComponent(username)}`;
      const contributionAreas = Array.isArray(application.contributionAreas) ? application.contributionAreas.filter(Boolean) : [];

      return {
        githubUsername: username,
        displayName,
        avatarUrl,
        profileUrl,
        points: aggregate.points,
        mergedPrs: aggregate.mergedPrs,
        easy: aggregate.easy,
        medium: aggregate.medium,
        hard: aggregate.hard,
        expert: aggregate.expert,
        additions: aggregate.additions,
        deletions: aggregate.deletions,
        loc: aggregate.additions + aggregate.deletions,
        contributionAreas,
        firstAwardedAt: aggregate.firstAwardedAt.toISOString(),
        lastAwardedAt: aggregate.lastAwardedAt.toISOString(),
      } satisfies Omit<FellowshipLeaderboardEntry, 'rank'>;
    }),
  );

  const filtered = leaderboard.filter((entry): entry is Omit<FellowshipLeaderboardEntry, 'rank'> => Boolean(entry));
  const sorted = sortLeaderboardEntries(filtered);

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function getFellowshipContributorWithDeps(
  username: string,
  deps: Partial<CommunityDataDeps>,
): Promise<ContributorProfile | null> {
  const normalized = normalizeGithubUsername(username);
  if (!normalized) {
    return null;
  }

  const [applications, contributions, publicContributors] = await Promise.all([
    (deps.loadApplications ?? loadApplications)(),
    (deps.loadContributions ?? loadContributions)(),
    getPublicContributorsWithDeps(deps),
  ]);

  const application = applications.find((item) => normalizeGithubUsername(item.githubUsername) === normalized);
  const aggregate = aggregateContributions(contributions).get(normalized);
  const publicContributor = publicContributors.find((item) => item.githubUsername === normalized);

  if (!application && !publicContributor && !aggregate) {
    return null;
  }

  const avatarUrl = publicContributor?.avatarUrl || fallbackAvatar(normalized);
  const profileUrl = publicContributor?.profileUrl || `https://github.com/${encodeURIComponent(normalized)}`;
  const points = aggregate?.points || 0;
  const mergedPrs = aggregate?.mergedPrs || 0;
  const easy = aggregate?.easy || 0;
  const medium = aggregate?.medium || 0;
  const hard = aggregate?.hard || 0;
  const expert = aggregate?.expert || 0;
  const loc = (aggregate?.additions || 0) + (aggregate?.deletions || 0);

  const leaderboard = await getFellowshipLeaderboardWithDeps(deps);
  const ranked = leaderboard.find((entry) => entry.githubUsername === normalized);

  return {
    githubUsername: normalized,
    displayName: publicContributor?.displayName || normalized,
    avatarUrl,
    profileUrl,
    contributions: publicContributor?.contributions || mergedPrs,
    mergedPrs,
    isFellowshipMember: Boolean(application),
    points,
    rank: ranked?.rank,
    easy,
    medium,
    hard,
    expert,
    additions: aggregate?.additions || 0,
    deletions: aggregate?.deletions || 0,
    loc,
    contributionAreas: application?.contributionAreas?.filter(Boolean) || [],
  };
}

export function hasHackRadarContributionSignal(labels: Array<string | { name?: string } | null | undefined>, body?: string | null): boolean {
  return issueLooksLikeHackRadar(labels, body);
}

function uniqueNumberList(values: number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      continue;
    }
    const rounded = Math.trunc(parsed);
    if (seen.has(rounded)) {
      continue;
    }
    seen.add(rounded);
    result.push(rounded);
  }
  return result;
}
