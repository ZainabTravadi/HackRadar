import assert from "assert";
import {
  buildCanonicalLabels,
  buildInheritableLabels,
  difficultyToPoints,
  extractLinkedIssueNumbers,
  hasHackRadarContributionSignal,
  inferTrackIdsFromLabels,
  issueSimilarityScore,
  loadContributorConfig,
  normalizeText,
  normalizeDifficultyLabel,
  ownershipWindowExpired,
  parseFellowshipSelection,
  parseHiddenMetadata,
  pickDuplicateCandidate,
} from "./hackradar-contributor-automation.mjs";

const config = await loadContributorConfig();

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("normalizes text for matching", () => {
  assert.strictEqual(normalizeText("  HackRadar Fellowship! "), "hackradar fellowship");
});

test("detects track labels from actual labels", () => {
  const trackIds = inferTrackIdsFromLabels(["crawler", "data"], config);
  assert.deepStrictEqual(trackIds, ["crawler-data"]);
});

test("parses hidden metadata", () => {
  const parsed = parseHiddenMetadata("<!-- hackradar-track: frontend --><!-- hackradar-kind: contribution --><!-- hackradar-difficulty-suggested: hard -->");
  assert.strictEqual(parsed.trackId, "frontend");
  assert.strictEqual(parsed.kindId, "contribution");
  assert.strictEqual(parsed.difficultySuggestion, "hard");
});

test("detects fellowship checkbox text", () => {
  assert.strictEqual(
    parseFellowshipSelection("- [x] This contribution is part of the HackRadar Fellowship"),
    true,
  );
  assert.strictEqual(
    parseFellowshipSelection("- [x] This contribution is not part of the HackRadar Fellowship"),
    false,
  );
});

test("extracts linked issue references", () => {
  assert.deepStrictEqual(
    extractLinkedIssueNumbers("Closes #12\nFixes #34\nRelated issue #56"),
    [12, 34],
  );
  assert.deepStrictEqual(extractLinkedIssueNumbers("Related issue #56"), [56]);
});

test("builds canonical labels from a track", () => {
  const issue = {
    number: 1,
    title: "Improve crawler coverage",
    body: "<!-- hackradar-track: crawler-data --><!-- hackradar-kind: contribution -->\n- [x] This contribution is part of the HackRadar Fellowship",
    labels: [],
  };
  assert.deepStrictEqual(buildCanonicalLabels(issue, config).sort(), ["crawler", "data", "hackradar fellowship"]);
});

test("inherits only repository-approved labels", () => {
  const labels = buildInheritableLabels(["crawler", "needs triage", "hackradar fellowship", "duplicate"], config).sort();
  assert.deepStrictEqual(labels, ["crawler", "hackradar fellowship"]);
});

test("scores duplicates and prefers close title matches", () => {
  const source = { number: 10, title: "Add frontend search filters", body: "Please add filters", labels: ["frontend"] };
  const candidate = { number: 11, title: "Add frontend search filters", body: "Please add filters", labels: ["frontend"] };
  assert.ok(issueSimilarityScore(source, candidate) > 0.9);
  const picked = pickDuplicateCandidate(source, [candidate]);
  assert.strictEqual(picked?.issue.number, 11);
});

test("expiry calculation uses 72 hours", () => {
  assert.strictEqual(ownershipWindowExpired("2026-08-11T00:00:00.000Z", new Date("2026-08-13T23:59:59.000Z")), false);
  assert.strictEqual(ownershipWindowExpired("2026-08-10T00:00:00.000Z", new Date("2026-08-13T00:00:00.000Z")), true);
});

test("maps difficulty labels and points", () => {
  assert.strictEqual(normalizeDifficultyLabel("difficulty: hard"), "hard");
  assert.strictEqual(normalizeDifficultyLabel("Expert"), "expert");
  assert.strictEqual(difficultyToPoints("easy"), 5);
  assert.strictEqual(difficultyToPoints("expert"), 50);
});

test("recognizes HackRadar contribution issue signals", () => {
  assert.strictEqual(
    hasHackRadarContributionSignal([{ name: "frontend" }], "Working on this"),
    true,
  );
  assert.strictEqual(
    hasHackRadarContributionSignal([{ name: "question" }], "Plain text only"),
    false,
  );
});

console.log("All HackRadar contributor automation tests passed");
