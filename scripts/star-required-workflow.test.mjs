import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/star-required.yml", import.meta.url), "utf8");
const lines = workflow.split(/\r?\n/);
const marker = lines.findIndex((line) => line.trim() === "script: |");
assert.notEqual(marker, -1, "star-required workflow must contain a github-script body");
const scriptLines = [];
for (const line of lines.slice(marker + 1)) {
  if (line.trim() && !line.startsWith("            ")) break;
  scriptLines.push(line.startsWith("            ") ? line.slice(12) : "");
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const executeWorkflowScript = new AsyncFunction("github", "context", "core", scriptLines.join("\n"));

async function run({ starred = true, initialLabel = false, existingCheck = false, failures = {} } = {}) {
  const calls = [];
  const checkConclusions = [];
  const warnings = [];
  const failuresReported = [];
  const labels = initialLabel ? [{ name: "star-required" }] : [];
  const comments = [];
  const fail = (operation) => {
    if (failures[operation]) throw new Error(failures[operation]);
  };
  const endpoint = (name, result) => Object.assign(async (...args) => {
    calls.push(name);
    fail(name);
    if (["checks.create", "checks.update"].includes(name)) checkConclusions.push(args[0]?.conclusion);
    return result;
  }, { operationName: name });
  const github = {
    rest: {
      pulls: { get: endpoint("pulls.get", { data: pullRequest }) },
      repos: { getCollaboratorPermissionLevel: endpoint("repos.getCollaboratorPermissionLevel", { data: { user: { permission: "read" } } }) },
      activity: { listReposStarredByUser: endpoint("activity.listReposStarredByUser", starred ? [{ full_name: "ZainabTravadi/HackRadar" }] : []) },
      issues: {
        listLabelsOnIssue: endpoint("issues.listLabelsOnIssue", labels),
        addLabels: endpoint("issues.addLabels", []),
        removeLabel: endpoint("issues.removeLabel", {}),
        listComments: endpoint("issues.listComments", comments),
        createComment: endpoint("issues.createComment", {}),
      },
      checks: {
        listForRef: endpoint("checks.listForRef", existingCheck ? [{ id: 17 }] : []),
        create: endpoint("checks.create", {}),
        update: endpoint("checks.update", {}),
      },
    },
    paginate: async (method, params) => {
      calls.push(`paginate:${method.operationName}`);
      fail(`paginate:${method.operationName}`);
      return method.operationName === "activity.listReposStarredByUser" ? method() : method(params);
    },
  };
  const core = {
    setFailed: (message) => failuresReported.push(message),
    warning: (message) => warnings.push(message),
  };
  await executeWorkflowScript(github, {
    repo: { owner: "ZainabTravadi", repo: "HackRadar" },
    payload: { pull_request: pullRequest },
  }, core);
  return { calls, warnings, failuresReported, checkConclusions };
}

const pullRequest = {
  number: 29,
  user: { login: "contributor", type: "User" },
  author_association: "NONE",
  head: { sha: "abc123" },
};

function test(name, fn) {
  return Promise.resolve().then(fn).then(() => console.log(`ok - ${name}`), (error) => {
    console.error(`not ok - ${name}`);
    throw error;
  });
}

await test("star present publishes success and completes secondary operations", async () => {
  const result = await run();
  assert.deepEqual(result.failuresReported, []);
  assert.ok(result.calls.includes("checks.create"));
  assert.deepEqual(result.checkConclusions, ["success"]);
  assert.ok(result.calls.includes("issues.createComment"));
});

await test("star present remains successful when label removal fails", async () => {
  const result = await run({ initialLabel: true, failures: { "issues.removeLabel": "label removal denied" } });
  assert.deepEqual(result.failuresReported, []);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.calls.includes("issues.createComment"));
});

await test("star present remains successful when verified comment fails", async () => {
  const result = await run({ failures: { "issues.createComment": "comment denied" } });
  assert.deepEqual(result.failuresReported, []);
  assert.match(result.warnings[0], /comment denied/);
});

await test("star absent publishes a failed check before label and comment operations", async () => {
  const result = await run({ starred: false });
  assert.ok(result.calls.indexOf("checks.create") < result.calls.indexOf("issues.addLabels"));
  assert.ok(result.failuresReported.some((message) => /star required/i.test(message)));
  assert.ok(result.calls.includes("issues.createComment"));
});

await test("star absent still attempts the comment when label update fails", async () => {
  const result = await run({ starred: false, failures: { "issues.addLabels": "label denied" } });
  assert.ok(result.failuresReported.some((message) => /star required/i.test(message)));
  assert.ok(result.calls.includes("issues.createComment"));
  assert.match(result.warnings[0], /label denied/);
});

await test("star API failure reports failure first and preserves the original error", async () => {
  const result = await run({ failures: { "paginate:activity.listReposStarredByUser": "star API unavailable", "checks.create": "check denied", "issues.addLabels": "label denied", "issues.createComment": "comment denied" } });
  assert.ok(result.failuresReported.some((message) => message.includes("star API unavailable")));
  assert.ok(result.calls.indexOf("checks.create") < result.calls.indexOf("issues.addLabels"));
  assert.ok(result.calls.includes("issues.createComment"));
  assert.ok(result.warnings.length >= 3);
  assert.equal(result.failuresReported.some((message) => /satisfied|verified/i.test(message)), false);
});

await test("failed check-run creation still fails an unstarred verification", async () => {
  const result = await run({ starred: false, failures: { "checks.create": "check create denied" } });
  assert.ok(result.failuresReported.some((message) => /star required/i.test(message)));
  assert.ok(result.calls.includes("issues.addLabels"));
  assert.ok(result.calls.includes("issues.createComment"));
  assert.match(result.warnings[0], /check create denied/);
});

await test("failed check-run update does not mask a verified star", async () => {
  const result = await run({ existingCheck: true, failures: { "checks.update": "check update denied" } });
  assert.deepEqual(result.failuresReported, []);
  assert.ok(result.calls.includes("issues.createComment"));
  assert.match(result.warnings[0], /check update denied/);
});

await test("a star API error remains a failure when check update also fails", async () => {
  const result = await run({ existingCheck: true, failures: { "paginate:activity.listReposStarredByUser": "original star error", "checks.update": "secondary update error", "issues.addLabels": "label error" } });
  assert.ok(result.failuresReported.some((message) => message.includes("original star error")));
  assert.equal(result.failuresReported.some((message) => message.includes("secondary update error")), false);
  assert.ok(result.warnings.some((message) => message.includes("secondary update error")));
});

await test("no failed or unavailable star check can publish success", async () => {
  const absent = await run({ starred: false });
  const unavailable = await run({ failures: { "paginate:activity.listReposStarredByUser": "unavailable" } });
  assert.equal(absent.calls.includes("checks.create") && absent.failuresReported.length > 0, true);
  assert.equal(unavailable.failuresReported.some((message) => /unavailable/.test(message)), true);
  assert.equal(absent.calls.filter((call) => call === "checks.create").length, 1);
  assert.equal(unavailable.calls.filter((call) => call === "checks.create").length, 1);
  assert.deepEqual(absent.checkConclusions, ["failure"]);
  assert.deepEqual(unavailable.checkConclusions, ["failure"]);
});
