import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/pr-labels.yml", import.meta.url), "utf8");
const eventBlock = workflow.match(/^on:\r?\n([\s\S]*?)(?=^permissions:)/m)?.[1] || "";
const permissionBlock = workflow.match(/^permissions:\r?\n((?: {2}.+\r?\n)+)/m)?.[1] || "";

assert.match(eventBlock, /^  pull_request_target:\s*$/m, "fork PR label writes require pull_request_target");
assert.doesNotMatch(eventBlock, /^  pull_request:\s*$/m, "the workflow must not use the read-only fork PR token");
assert.match(permissionBlock, /^  contents: read\s*$/m, "checkout requires contents read");
assert.match(permissionBlock, /^  issues: write\s*$/m, "inherited PR labels require issues write");
assert.doesNotMatch(permissionBlock, /pull-requests:\s*write|contents:\s*write/, "permissions must remain least-privilege");
assert.match(workflow, /node scripts\/hackradar-contributor-automation\.mjs pr-labels/);
assert.doesNotMatch(workflow, /^\s+ref:.*pull_request\.head/m, "never check out untrusted PR head code");

console.log("PR label workflow uses the trusted target event with least-privilege permissions.");
