import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { parse } = require("yaml");

const workflowText = await readFile(new URL("../.github/workflows/pr-labels.yml", import.meta.url), "utf8");
const workflow = parse(workflowText);

function assertKeys(value, expected, context) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${context} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${context} has unexpected or missing keys`);
}

function assertSecureWorkflow(candidate) {
  assertKeys(candidate, ["name", "on", "permissions", "concurrency", "jobs"], "workflow");
  assert.equal(candidate.name, "PR Label Inheritance");

  assertKeys(candidate.on, ["pull_request_target"], "workflow triggers");
  assert.deepEqual(candidate.on.pull_request_target.types, ["opened", "reopened", "synchronize", "edited"], "pull_request_target events must remain explicit");
  assertKeys(candidate.on.pull_request_target, ["types"], "pull_request_target trigger");

  assertKeys(candidate.permissions, ["contents", "issues"], "top-level permissions");
  assert.deepEqual(candidate.permissions, { contents: "read", issues: "write" }, "permissions must stay at the intended minimum");

  assertKeys(candidate.concurrency, ["group", "cancel-in-progress"], "concurrency");
  assert.equal(candidate.concurrency.group, "pr-labels-${{ github.event.pull_request.number }}");
  assert.equal(candidate.concurrency["cancel-in-progress"], false);

  assertKeys(candidate.jobs, ["inherit"], "jobs");
  const job = candidate.jobs.inherit;
  assertKeys(job, ["name", "runs-on", "steps"], "inherit job");
  assert.equal(job.name, "Copy inheritable labels from linked issues");
  assert.equal(job["runs-on"], "ubuntu-latest");
  assert.equal(job.steps.length, 3, "only the reviewed checkout and two automation commands may run");

  const [checkout, ensureLabels, inheritLabels] = job.steps;
  assert.deepEqual(checkout, { name: "Checkout", uses: "actions/checkout@v4" }, "checkout must use trusted base context defaults without overrides");

  const expectedEnv = {
    GITHUB_TOKEN: "${{ github.token }}",
    GITHUB_REPOSITORY: "${{ github.repository }}",
    GITHUB_EVENT_PATH: "${{ github.event_path }}",
  };
  assert.deepEqual(ensureLabels, {
    name: "Ensure canonical labels exist",
    run: "node scripts/hackradar-contributor-automation.mjs ensure-labels",
    env: expectedEnv,
  }, "the ensure-labels command and its inputs must remain allowlisted");
  assert.deepEqual(inheritLabels, {
    name: "Inherit labels",
    run: "node scripts/hackradar-contributor-automation.mjs pr-labels",
    env: expectedEnv,
  }, "the pr-labels command and its inputs must remain allowlisted");
}

assertSecureWorkflow(workflow);

function rejectsMutation(name, mutate) {
  const candidate = structuredClone(workflow);
  mutate(candidate);
  assert.throws(() => assertSecureWorkflow(candidate), undefined, `${name} must be rejected`);
}

rejectsMutation("job-level permission escalation", (candidate) => {
  candidate.jobs.inherit.permissions = { contents: "write", issues: "write" };
});
rejectsMutation("step-level permission escalation", (candidate) => {
  candidate.jobs.inherit.steps[1].permissions = { contents: "write", issues: "write" };
});
rejectsMutation("extra step fetching and executing fork code", (candidate) => {
  candidate.jobs.inherit.steps.push({ name: "Run contributor code", run: "git fetch origin pull/1/head:pr && node pr/script.js" });
});
rejectsMutation("checkout targeting the PR head", (candidate) => {
  candidate.jobs.inherit.steps[0].with = { ref: "${{ github.event.pull_request.head.sha }}" };
});
rejectsMutation("unexpected executable step", (candidate) => {
  candidate.jobs.inherit.steps.push({ name: "Unexpected command", run: "node scripts/other.mjs" });
});
rejectsMutation("missing trusted checkout", (candidate) => {
  candidate.jobs.inherit.steps.shift();
});
rejectsMutation("incorrect checkout action", (candidate) => {
  candidate.jobs.inherit.steps[0].uses = "actions/checkout@v4-with-untrusted-inputs";
});
rejectsMutation("alternate checkout repository", (candidate) => {
  candidate.jobs.inherit.steps[0].with = { repository: "${{ github.event.pull_request.head.repo.full_name }}" };
});
rejectsMutation("changed trigger", (candidate) => {
  candidate.on.pull_request = {};
});
rejectsMutation("escalated or missing required permissions", (candidate) => {
  candidate.permissions.contents = "write";
});

console.log("PR label workflow structure is allowlisted; intended workflow passes and 10 unsafe mutations are rejected.");
