import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePullRequestLabelTarget } from "./hackradar-contributor-automation.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(await readFile(path.join(repoRoot, ".github", "hackradar-contributor-config.json"), "utf8"));

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("PR label target uses the base repository and pull request number", () => {
  const target = resolvePullRequestLabelTarget({
    pull_request: {
      number: 34,
      base: { repo: { full_name: "ZainabTravadi/HackRadar" } },
      head: { repo: { full_name: "yugdabgar21/HackRadar" } },
    },
  }, "ZainabTravadi/HackRadar");

  assert.deepEqual(target, { repository: "ZainabTravadi/HackRadar", issueNumber: 34 });
});

test("PR label target rejects a repository context that disagrees with the base", () => {
  assert.throws(
    () => resolvePullRequestLabelTarget({
      pull_request: {
        number: 34,
        base: { repo: { full_name: "ZainabTravadi/HackRadar" } },
        head: { repo: { full_name: "yugdabgar21/HackRadar" } },
      },
    }, "yugdabgar21/HackRadar"),
    /does not match configured repository/,
  );
});

const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "hackradar-pr-labels-"));
const eventPath = path.join(tempDirectory, "event.json");
await writeFile(eventPath, JSON.stringify({
  action: "opened",
  pull_request: {
    number: 34,
    body: "- [x] This contribution is part of the HackRadar Fellowship",
    labels: [],
    user: { login: "fork-contributor", type: "User" },
    base: { repo: { full_name: "ZainabTravadi/HackRadar" } },
    head: { repo: { full_name: "yugdabgar21/HackRadar" } },
  },
}));

let capturedLabelRequest;
const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url.startsWith("/repos/ZainabTravadi/HackRadar/labels?")) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(config.labels));
    return;
  }

  if (request.method === "POST" && request.url === "/repos/ZainabTravadi/HackRadar/issues/34/labels") {
    let body = "";
    for await (const chunk of request) body += chunk;
    capturedLabelRequest = {
      authorization: request.headers.authorization,
      body: JSON.parse(body),
    };
    response.writeHead(403, {
      "Content-Type": "application/json",
      "X-Accepted-GitHub-Permissions": "issues=write",
      "X-GitHub-Request-Id": "TEST-REQUEST-ID",
    });
    response.end(JSON.stringify({ message: "Resource not accessible by integration" }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ message: `Unexpected request: ${request.method} ${request.url}` }));
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const token = "test-token-must-not-be-logged";
  const child = spawn(process.execPath, [path.join(repoRoot, "scripts", "hackradar-contributor-automation.mjs"), "pr-labels"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      GITHUB_API_URL: `http://127.0.0.1:${port}`,
      GITHUB_REPOSITORY: "ZainabTravadi/HackRadar",
      GITHUB_TOKEN: token,
      GITHUB_EVENT_PATH: eventPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(capturedLabelRequest, {
    authorization: `Bearer ${token}`,
    body: { labels: [config.canonicalFellowshipLabel] },
  });
  assert.match(output, /POST \/repos\/ZainabTravadi\/HackRadar\/issues\/34\/labels failed: 403 Resource not accessible by integration/);
  assert.match(output, /X-Accepted-GitHub-Permissions: issues=write/);
  assert.match(output, /X-GitHub-Request-Id: TEST-REQUEST-ID/);
  assert.match(output, /token source: GITHUB_TOKEN/);
  assert.doesNotMatch(output, new RegExp(token));
  assert.doesNotMatch(output, /Authorization:/i);
  console.log("ok - 403 diagnostics include response metadata without exposing credentials");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(tempDirectory, { recursive: true, force: true });
}
