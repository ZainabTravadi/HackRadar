import { readFile } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT_DIR, ".github", "hackradar-contributor-config.json");
const GITHUB_API_BASE = process.env.GITHUB_API_URL || "https://api.github.com";
const GITHUB_GRAPHQL_BASE = process.env.GITHUB_GRAPHQL_URL || "https://api.github.com/graphql";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "their",
  "this",
  "to",
  "want",
  "we",
  "with",
  "work",
  "work on",
  "work on it",
  "you",
  "your",
]);

export async function loadContributorConfig() {
  const raw = await readFile(CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function inferTrackIdsFromLabels(labels, config) {
  const labelSet = new Set(labels.map((label) => normalizeText(label)));
  return config.tracks
    .filter((track) => (config.trackLabels[track.id] || []).some((label) => labelSet.has(normalizeText(label))))
    .map((track) => track.id);
}

export function inferCanonicalLabelsFromTrackIds(trackIds, config) {
  const labels = [];
  for (const trackId of trackIds) {
    const trackLabels = config.trackLabels[trackId] || [];
    labels.push(...trackLabels);
  }
  return unique(labels);
}

export function inferIssueKindFromLabels(labels) {
  const normalized = new Set(labels.map((label) => normalizeText(label)));
  if (normalized.has("bug")) return "bug-report";
  if (normalized.has("enhancement")) return "feature-request";
  return null;
}

export function parseHiddenMetadata(body) {
  const text = String(body || "");
  const trackMatch = text.match(/<!--\s*hackradar-track:\s*([a-z0-9-]+)\s*-->/i);
  const kindMatch = text.match(/<!--\s*hackradar-kind:\s*([a-z0-9-]+)\s*-->/i);
  const templateMatch = text.match(/<!--\s*hackradar-template:\s*([a-z0-9-]+)\s*-->/i);
  const difficultyMatch = text.match(/<!--\s*hackradar-difficulty-suggested:\s*(easy|medium|hard|expert)\s*-->/i);
  return {
    trackId: trackMatch?.[1] || templateMatch?.[1] || null,
    kindId: kindMatch?.[1] || null,
    difficultySuggestion: difficultyMatch?.[1]?.toLowerCase() || null,
  };
}

export function parseFellowshipSelection(body) {
  const text = String(body || "");
  if (!text) return false;

  const question = /Are you completing this contribution as part of the HackRadar Fellowship\?/i;
  const questionIndex = text.search(question);
  if (questionIndex >= 0) {
    const window = text.slice(questionIndex, questionIndex + 240);
    if (/\bYes\b/i.test(window) && !/\bNo\b/i.test(window)) {
      return true;
    }
    if (/\bNo\b/i.test(window) && !/\bYes\b/i.test(window)) {
      return false;
    }
  }

  const checkedPatterns = [
    /This contribution is part of the HackRadar Fellowship/i,
    /Are you completing this contribution as part of the HackRadar Fellowship\?[\s\S]{0,200}\[\s*x\s*\]/i,
    /HackRadar Fellowship[\s\S]{0,120}\[\s*x\s*\]/i,
    /\[\s*x\s*\]\s*Yes[\s\S]{0,120}HackRadar Fellowship/i,
  ];

  const uncheckedPatterns = [
    /This contribution is not part of the HackRadar Fellowship/i,
    /Are you completing this contribution as part of the HackRadar Fellowship\?[\s\S]{0,200}\[\s*\]\s*No/i,
  ];

  if (uncheckedPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  return checkedPatterns.some((pattern) => pattern.test(text));
}

export function extractLinkedIssueNumbers(body) {
  const text = String(body || "");
  const issueNumbers = new Set();

  for (const match of text.matchAll(/(?:fixes|closes|resolves|refs?|references?)\s+#(\d+)/gi)) {
    issueNumbers.add(Number(match[1]));
  }

  if (issueNumbers.size > 0) {
    return [...issueNumbers];
  }

  const directMatches = [...text.matchAll(/(^|[^\w])#(\d+)\b/g)].map((match) => Number(match[2]));
  const uniqueDirectMatches = unique(directMatches);

  if (uniqueDirectMatches.length === 1 && /related issue|related issues|related ticket/i.test(text)) {
    return uniqueDirectMatches;
  }

  return uniqueDirectMatches.length === 1 && /closes|fixes|resolves/i.test(text) ? uniqueDirectMatches : [];
}

export function tokenSimilarity(left, right) {
  const leftTokens = new Set(normalizeTokens(left));
  const rightTokens = new Set(normalizeTokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

export function issueSimilarityScore(leftIssue, rightIssue) {
  const leftText = `${leftIssue.title || ""}\n${leftIssue.body || ""}`;
  const rightText = `${rightIssue.title || ""}\n${rightIssue.body || ""}`;
  const leftTitle = normalizeText(leftIssue.title || "");
  const rightTitle = normalizeText(rightIssue.title || "");

  if (!leftTitle || !rightTitle) {
    return 0;
  }

  if (leftTitle === rightTitle) {
    return 1;
  }

  const titleScore = tokenSimilarity(leftIssue.title || "", rightIssue.title || "");
  const bodyScore = tokenSimilarity(leftText, rightText);

  const leftLabels = new Set((leftIssue.labels || []).map((label) => normalizeText(typeof label === "string" ? label : label.name)));
  const rightLabels = new Set((rightIssue.labels || []).map((label) => normalizeText(typeof label === "string" ? label : label.name)));
  let labelOverlap = 0;
  for (const label of leftLabels) {
    if (rightLabels.has(label)) {
      labelOverlap += 1;
    }
  }
  const labelScore = leftLabels.size === 0 && rightLabels.size === 0 ? 0 : labelOverlap / new Set([...leftLabels, ...rightLabels]).size;

  const substringScore =
    leftTitle.includes(rightTitle) || rightTitle.includes(leftTitle) ? 1 : 0;

  return Math.min(1, titleScore * 0.5 + bodyScore * 0.3 + labelScore * 0.15 + substringScore * 0.05);
}

export function pickDuplicateCandidate(issue, existingIssues) {
  let best = null;

  for (const candidate of existingIssues) {
    if (candidate.number === issue.number) {
      continue;
    }

    const score = issueSimilarityScore(issue, candidate);
    if (!best || score > best.score) {
      best = { issue: candidate, score };
    }
  }

  if (!best || best.score < 0.45) {
    return null;
  }

  return {
    ...best,
    confidence: best.score >= 0.8 ? "high" : "low",
  };
}

export function isContributionIssue(issue, config) {
  const labels = (issue.labels || []).map((label) => (typeof label === "string" ? label : label.name));
  const trackIds = inferTrackIdsFromLabels(labels, config);
  const kindId = inferIssueKindFromLabels(labels);
  const metadata = parseHiddenMetadata(issue.body);

  return trackIds.length > 0 || Boolean(kindId || metadata.trackId || metadata.kindId);
}

export function buildCanonicalLabels(issue, config) {
  const labels = (issue.labels || []).map((label) => (typeof label === "string" ? label : label.name));
  const metadata = parseHiddenMetadata(issue.body);
  const trackIds = unique([
    ...(metadata.trackId ? [metadata.trackId] : []),
    ...inferTrackIdsFromLabels(labels, config),
  ]).filter((trackId) => config.tracks.some((track) => track.id === trackId));
  const kindId = metadata.kindId || inferIssueKindFromLabels(labels);
  const canonical = inferCanonicalLabelsFromTrackIds(trackIds, config);

  if (kindId === "bug-report") {
    canonical.push("bug");
  }
  if (kindId === "feature-request") {
    canonical.push("enhancement");
  }

  if (parseFellowshipSelection(issue.body)) {
    canonical.push(config.canonicalFellowshipLabel);
  }

  return unique(canonical);
}

export function buildInheritableLabels(issueLabels, config) {
  const labels = issueLabels.map((label) => (typeof label === "string" ? label : label.name));
  const canonical = new Set(config.inheritableLabels.map((label) => normalizeText(label)));
  return unique(labels.filter((label) => canonical.has(normalizeText(label))));
}

export function ownershipWindowExpired(assignedAt, now = new Date()) {
  if (!assignedAt) {
    return false;
  }

  const assignmentTime = new Date(assignedAt).getTime();
  const currentTime = new Date(now).getTime();
  if (Number.isNaN(assignmentTime) || Number.isNaN(currentTime)) {
    return false;
  }

  return currentTime - assignmentTime >= 72 * 60 * 60 * 1000;
}

export function parseIssueTemplateBody(body) {
  const text = String(body || "");
  const trackIdMatch = text.match(/<!--\s*hackradar-track:\s*([a-z0-9-]+)\s*-->/i);
  const kindIdMatch = text.match(/<!--\s*hackradar-kind:\s*([a-z0-9-]+)\s*-->/i);
  return {
    trackId: trackIdMatch?.[1] || null,
    kindId: kindIdMatch?.[1] || null,
    fellowship: parseFellowshipSelection(text),
    linkedIssues: extractLinkedIssueNumbers(text),
  };
}

async function githubRequest(method, route, body) {
  if (!GITHUB_REPOSITORY) {
    throw new Error("GITHUB_REPOSITORY is required");
  }

  const url = route.startsWith("http") ? route : `${GITHUB_API_BASE}${route}`;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = payload?.message || text || response.statusText;
    const error = new Error(`GitHub API ${method} ${route} failed: ${response.status} ${message}`);
    error.status = response.status;
    error.body = payload || text;
    throw error;
  }

  return payload;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function githubPaginate(route) {
  const results = [];
  let page = 1;

  while (true) {
    const joiner = route.includes("?") ? "&" : "?";
    const data = await githubRequest("GET", `${route}${joiner}per_page=100&page=${page}`);
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    results.push(...data);
    if (data.length < 100) {
      break;
    }

    page += 1;
  }

  return results;
}

async function ensureLabels(config) {
  const existing = await githubPaginate(`/repos/${GITHUB_REPOSITORY}/labels`);
  const byName = new Map(existing.map((label) => [normalizeText(label.name), label]));

  for (const label of config.labels) {
    const existingLabel = byName.get(normalizeText(label.name));
    const payload = {
      name: label.name,
      color: label.color,
      description: label.description,
    };

    if (!existingLabel) {
      await githubRequest("POST", `/repos/${GITHUB_REPOSITORY}/labels`, payload);
      continue;
    }

    if (
      normalizeText(existingLabel.color || "") !== normalizeText(label.color || "") ||
      normalizeText(existingLabel.description || "") !== normalizeText(label.description || "")
    ) {
      await githubRequest("PATCH", `/repos/${GITHUB_REPOSITORY}/labels/${encodeURIComponent(label.name)}`, payload);
    }
  }
}

async function listOpenIssues() {
  const issues = await githubPaginate(`/repos/${GITHUB_REPOSITORY}/issues?state=open&sort=created&direction=desc`);
  return issues.filter((issue) => !issue.pull_request);
}

async function listRecentPullRequests(days = 4) {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = `repo:${GITHUB_REPOSITORY} is:pr created:>=${from}`;
  const results = [];
  let page = 1;

  while (true) {
    const payload = await githubRequest("GET", `/search/issues?q=${encodeURIComponent(query)}&per_page=100&page=${page}`);
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (items.length === 0) {
      break;
    }

    results.push(...items);
    if (items.length < 100) {
      break;
    }

    page += 1;
  }

  return results;
}

async function listIssueEvents(issueNumber) {
  return githubPaginate(`/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/events`);
}

async function listIssueComments(issueNumber) {
  return githubPaginate(`/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/comments`);
}

async function commentExists(issueNumber, marker) {
  const comments = await listIssueComments(issueNumber);
  return comments.some((comment) => String(comment.body || "").includes(marker));
}

async function addIssueComment(issueNumber, body) {
  await githubRequest("POST", `/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/comments`, { body });
}

async function addIssueLabels(issueNumber, labels) {
  const uniqueLabels = unique(labels);
  if (uniqueLabels.length === 0) {
    return;
  }

  await githubRequest("POST", `/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/labels`, { labels: uniqueLabels });
}

async function removeIssueAssignees(issueNumber, assignees) {
  if (!assignees || assignees.length === 0) {
    return;
  }

  await githubRequest("DELETE", `/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/assignees`, {
    assignees,
  });
}

async function assignIssue(issueNumber, assignee) {
  await githubRequest("POST", `/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/assignees`, {
    assignees: [assignee],
  });
}

function isBotUser(user) {
  if (!user) return false;
  return Boolean(user.type === "Bot" || /(\[bot\])$/i.test(user.login || ""));
}

async function handleIssueOpened(config, event, options = {}) {
  const issue = event.issue;
  if (!issue || isBotUser(issue.user)) {
    return;
  }

  const canonicalLabels = buildCanonicalLabels(issue, config);
  const labelsToAdd = canonicalLabels.filter((label) => !new Set((issue.labels || []).map((entry) => entry.name || entry)).has(label));

  if (labelsToAdd.length > 0) {
    await addIssueLabels(issue.number, labelsToAdd);
  }

  const isContribution = isContributionIssue(issue, config);
  if (isContribution) {
    const openContributionIssues = await countOpenContributionIssuesByUser(issue.user.login, config);
    if (openContributionIssues > 7) {
      await addContributionLimitNotice(issue, issue.user.login, openContributionIssues);
      return;
    }
  }

  if (!options.skipAssignment && isContribution && issue.assignees?.length === 0) {
    try {
      await assignIssue(issue.number, issue.user.login);
      console.log(`Assigned issue #${issue.number} to ${issue.user.login}`);
    } catch (error) {
      console.log(`Could not assign issue #${issue.number} to ${issue.user.login}: ${error.message}`);
    }
  }
}

async function handleIssueClaim(config, event) {
  const issue = event.issue;
  const comment = event.comment;
  if (!issue || !comment || issue.pull_request || isBotUser(comment.user)) {
    return;
  }

  const text = String(comment.body || "");
  if (!/^\s*\/claim\s*$/i.test(text.trim())) {
    return;
  }

  if (!isContributionIssue(issue, config)) {
    return;
  }

  if ((issue.assignees || []).length > 0) {
    return;
  }

  try {
    await assignIssue(issue.number, comment.user.login);
    console.log(`Claimed issue #${issue.number} for ${comment.user.login}`);
  } catch (error) {
    console.log(`Could not claim issue #${issue.number} for ${comment.user.login}: ${error.message}`);
  }
}

async function countOpenContributionIssuesByUser(login, config) {
  const issues = await listOpenIssues();
  return issues.filter((issue) => issue.user?.login === login && isContributionIssue(issue, config)).length;
}

async function addContributionLimitNotice(issue, login, count) {
  const marker = "<!-- hackradar-open-issue-limit -->";
  const alreadyCommented = await commentExists(issue.number, marker);

  if (!alreadyCommented) {
    await addIssueComment(
      issue.number,
      `${marker}\n@${login} already has ${count} open contribution issue(s).\n\nHackRadar keeps a 7-issue ownership window so active contributors can move work forward without permanently locking issues.`,
    );
  }

  const labels = new Set((issue.labels || []).map((label) => (label.name || label)));
  const labelsToAdd = [];
  if (!labels.has("blocked")) {
    labelsToAdd.push("blocked");
  }
  if (!labels.has("needs triage")) {
    labelsToAdd.push("needs triage");
  }
  if (labelsToAdd.length > 0) {
    await addIssueLabels(issue.number, labelsToAdd);
  }
}

function issueLooksLikeHackRadarContribution(issue) {
  const labels = (issue.labels || []).map((label) => (label.name || label));
  const normalized = new Set(labels.map((label) => normalizeText(label)));
  const metadata = parseHiddenMetadata(issue.body);

  if (metadata.trackId) {
    return true;
  }

  return [
    "frontend",
    "backend",
    "crawler",
    "data",
    "design",
    "documentation",
    "community",
    "testing",
    "accessibility",
    "bug",
    "enhancement",
    "hackradar fellowship",
  ].some((label) => normalized.has(label));
}

async function fetchIssueDetails(issueNumber) {
  return githubRequest("GET", `/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}`);
}

async function pickPrimaryLinkedIssue(issueNumbers) {
  for (const issueNumber of issueNumbers) {
    try {
      const issue = await fetchIssueDetails(issueNumber);
      if (issue && !issue.pull_request && issueLooksLikeHackRadarContribution(issue)) {
        return issue;
      }
    } catch (error) {
      console.log(`Could not load linked issue #${issueNumber}: ${error.message}`);
    }
  }

  return null;
}

async function sendContributionToBackend(payload) {
  const baseUrl = (process.env.HACKRADAR_BACKEND_URL || "").trim().replace(/\/$/, "");
  const secret = (process.env.HACKRADAR_INTERNAL_SECRET || process.env.INTERNAL_SECRET || "").trim();

  if (!baseUrl || !secret) {
    console.log("Fellowship contribution sync skipped because BACKEND URL or internal secret is missing.");
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/internal/fellowship/contributions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : {};
    if (!response.ok) {
      console.log(`Fellowship contribution sync failed: ${response.status} ${parsed?.error || text || response.statusText}`);
      return;
    }

    if (parsed?.duplicate) {
      console.log(`Fellowship contribution sync skipped duplicate PR #${payload.prNumber}.`);
      return;
    }

    console.log(`Recorded fellowship contribution for PR #${payload.prNumber}.`);
  } catch (error) {
    console.log(`Fellowship contribution sync error: ${error.message}`);
  }
}

async function handleFellowshipContributionRecord(config, event) {
  const pr = event.pull_request;
  if (!pr || !pr.merged || isBotUser(pr.user)) {
    return;
  }

  const body = String(pr.body || "");
  const linkedIssueNumbers = extractLinkedIssueNumbers(body);
  if (linkedIssueNumbers.length === 0) {
    return;
  }

  const primaryIssue = await pickPrimaryLinkedIssue(linkedIssueNumbers);
  if (!primaryIssue) {
    return;
  }

  const issueLabels = (primaryIssue.labels || []).map((label) => label.name || label);
  if (!issueLooksLikeHackRadarContribution(primaryIssue)) {
    return;
  }

  await sendContributionToBackend({
    repository: GITHUB_REPOSITORY,
    prNumber: pr.number,
    prUrl: pr.html_url,
    githubUsername: pr.user?.login,
    issueNumber: primaryIssue.number,
    linkedIssueNumbers,
    issueLabels,
    issueBody: primaryIssue.body || "",
    mergedAt: pr.merged_at || pr.closed_at || new Date().toISOString(),
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
  });
}

async function handleDuplicateDetection(config, event) {
  const issue = event.issue;
  if (!issue || issue.pull_request || isBotUser(issue.user)) {
    return;
  }

  if (!isContributionIssue(issue, config)) {
    return;
  }

  const marker = "<!-- hackradar-duplicate-suspected -->";
  const alreadyCommented = await commentExists(issue.number, marker);
  const existingIssues = await listOpenIssues();
  const candidate = pickDuplicateCandidate(issue, existingIssues);

  if (!candidate) {
    if (!alreadyCommented && !issue.labels?.some((label) => (label.name || label) === "needs triage")) {
      await addIssueLabels(issue.number, ["needs triage"]);
    }
    return null;
  }

  if (!issue.labels?.some((label) => (label.name || label) === "duplicate")) {
    await addIssueLabels(issue.number, ["duplicate"]);
  }

  if (
    candidate.confidence === "high" &&
    issue.assignees?.length === 1 &&
    issue.assignees[0]?.login === issue.user?.login
  ) {
    await removeIssueAssignees(issue.number, [issue.user.login]);
  }

  if (!alreadyCommented) {
    await addIssueComment(
      issue.number,
      `${marker}\nPossible duplicate - please check #${candidate.issue.number}.\n\nThis is an advisory match, and maintainers will make the final call.`,
    );
  }

  return candidate;
}

async function handlePrLabelInheritance(config, event) {
  const pr = event.pull_request;
  if (!pr || isBotUser(pr.user)) {
    return;
  }

  const body = String(pr.body || "");
  const linkedIssueNumbers = extractLinkedIssueNumbers(body);
  const labels = new Set();

  for (const issueNumber of linkedIssueNumbers) {
    try {
      const issue = await githubRequest("GET", `/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}`);
      const issueLabels = (issue.labels || []).map((label) => label.name);
      for (const label of buildInheritableLabels(issueLabels, config)) {
        labels.add(label);
      }
      if (parseFellowshipSelection(issue.body)) {
        labels.add(config.canonicalFellowshipLabel);
      }
    } catch (error) {
      console.log(`Could not load linked issue #${issueNumber}: ${error.message}`);
    }
  }

  if (parseFellowshipSelection(body)) {
    labels.add(config.canonicalFellowshipLabel);
  }

  const existing = new Set((pr.labels || []).map((label) => label.name || label));
  const missing = [...labels].filter((label) => !existing.has(label));

  if (missing.length > 0) {
    await addIssueLabels(pr.number, missing);
  }
}

function pickAssignmentTimestamp(events, assigneeLogin) {
  const assignedEvents = events.filter(
    (event) => event.event === "assigned" && event.assignee?.login === assigneeLogin,
  );
  if (assignedEvents.length === 0) {
    return null;
  }

  return assignedEvents[assignedEvents.length - 1].created_at || null;
}

function pullRequestQualifies(pr, issueNumber, assignmentTimestamp) {
  if (!assignmentTimestamp) {
    return false;
  }

  const createdAt = new Date(pr.created_at).getTime();
  const assignedAt = new Date(assignmentTimestamp).getTime();
  if (Number.isNaN(createdAt) || Number.isNaN(assignedAt)) {
    return false;
  }

  if (createdAt < assignedAt) {
    return false;
  }

  const issueRefs = extractLinkedIssueNumbers(`${pr.title || ""}\n${pr.body || ""}`);
  return issueRefs.includes(issueNumber);
}

async function handleOwnershipExpiry(config) {
  const issues = await listOpenIssues();
  const candidateIssues = issues.filter((issue) => isContributionIssue(issue, config) && (issue.assignees || []).length === 1);
  if (candidateIssues.length === 0) {
    return;
  }

  const recentPullRequests = await listRecentPullRequests(4);

  for (const issue of candidateIssues) {
    const assignee = issue.assignees[0]?.login;
    if (!assignee) {
      continue;
    }

    const events = await listIssueEvents(issue.number);
    const assignmentTimestamp = pickAssignmentTimestamp(events, assignee);
    if (!assignmentTimestamp) {
      continue;
    }

    const deadline = new Date(new Date(assignmentTimestamp).getTime() + 72 * 60 * 60 * 1000);
    const now = new Date();
    if (now < deadline) {
      continue;
    }

    const qualifiedPr = recentPullRequests.find((pr) => pullRequestQualifies(pr, issue.number, assignmentTimestamp));
    if (qualifiedPr) {
      continue;
    }

    const marker = "<!-- hackradar-ownership-expired -->";
    const alreadyCommented = await commentExists(issue.number, marker);
    if (!alreadyCommented) {
      await addIssueComment(
        issue.number,
        `${marker}\nThe 72-hour ownership window for this issue has expired, so the assignment has been cleared.\n\nThe issue is still open and available for another contributor.`,
      );
    }

    await removeIssueAssignees(issue.number, [assignee]);
    if (!issue.labels?.some((label) => (label.name || label) === "needs triage")) {
      await addIssueLabels(issue.number, ["needs triage"]);
    }
  }
}

async function main() {
  const command = process.argv[2];
  const config = await loadContributorConfig();
  const event = await readEvent();

  switch (command) {
    case "ensure-labels":
      await ensureLabels(config);
      break;
    case "issue-opened": {
      await ensureLabels(config);
      const duplicateCandidate = await handleDuplicateDetection(config, event);
      await handleIssueOpened(config, event, { skipAssignment: Boolean(duplicateCandidate) });
      break;
    }
    case "issue-claimed":
      await handleIssueClaim(config, event);
      break;
    case "pr-labels":
      await ensureLabels(config);
      await handlePrLabelInheritance(config, event);
      break;
    case "record-fellowship":
      await handleFellowshipContributionRecord(config, event);
      break;
    case "expire-ownership":
      await ensureLabels(config);
      await handleOwnershipExpiry(config);
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function readEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH is required");
  }

  const raw = await readFile(eventPath, "utf8");
  return JSON.parse(raw);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
