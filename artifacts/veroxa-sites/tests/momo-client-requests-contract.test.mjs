import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readApp = (name) => readFile(new URL(`../app/${name}`, import.meta.url), "utf8");

test("Client and Team request routes use the bounded private RPC contract", async () => {
  const [page, data, center] = await Promise.all([
    readApp("page.tsx"),
    readApp("momo-data.ts"),
    readApp("momo-operating-center.tsx"),
  ]);

  assert.match(page, /"\/client\/requests": "requests"/);
  assert.match(page, /"\/team\/momo\/requests": "team-requests"/);
  assert.match(page, /label: "Requests"/);
  assert.match(page, /label: "Client Requests"/);

  for (const rpc of [
    "veroxa_create_client_request_v1",
    "veroxa_append_request_message_v1",
    "veroxa_transition_client_request_v1",
    "veroxa_create_client_request_work_v1",
    "veroxa_list_client_requests_v1",
    "veroxa_request_thread_v1",
  ]) assert.match(data, new RegExp(`\\.rpc\\("${rpc}"`), `${rpc} must be called from the browser adapter`);

  assert.doesNotMatch(data, /\.from\("veroxa_(?:client_requests|request_messages)"\)/, "Private request tables must never be read or written directly");
  assert.match(data, /if \(section === "requests"\) return emptyMomoWorkspaceData\(\)/, "Request routes must bypass the broad Client snapshot loader");
  assert.match(data, /value\.some\(\(item\) => !item \|\| typeof item !== "object" \|\| Array\.isArray\(item\)\)/, "Malformed RPC arrays must fail closed");
  assert.match(data, /value\.length === 1 \? value\[0\] : null/, "Mutation RPCs must reject empty or multi-row responses");
  assert.match(data, /requestStatuses\.has\(row\.status as MomoClientRequest\["status"\]\)/, "An exact create retry must accept the request's current valid status after the queue advances");

  assert.match(center, /Manual pilot remains No-Go/);
  assert.match(center, /role !== "client" \|\| !requestFormValid/, "Only Client UI may submit a new request");
  assert.match(center, /role !== "team" \|\| !selected \|\| !transitionValid/, "Only Team UI may transition a request");
  assert.match(center, /\["acknowledged", "in_progress"\]\.includes\(selected\.status\)/, "Linked work must require an active acknowledged request");
  assert.match(center, /createMomoClientRequestWork\(/, "Request-linked work must use its transactional RPC adapter");
  assert.match(center, /No Momo Client request has been persisted/, "The zero-request Team view must remain honest");
  assert.match(center, /sequence !== threadLoadSequence\.current/, "Stale thread responses must never replace the current request");
  assert.match(center, /threadRequestId === selectedId \? thread : \[\]/, "A previous request thread must be hidden immediately when selection changes");
  assert.match(data, /"request_thread_is_closed"/, "The adapter must preserve the closed-thread database error code");
  assert.match(center, /if \(!selected \|\| requestClosed \|\| !messageValid\) return/, "A stale browser must not submit a message for a closed request");
  assert.match(center, /\{requestClosed\s*\? <p className="momo-form-note">This request is closed/, "Closed requests must render immutable history without a message composer");
});

test("request-linked work preserves one idempotency key across retries and rotates it on payload changes", async () => {
  const [data, center] = await Promise.all([readApp("momo-data.ts"), readApp("momo-operating-center.tsx")]);

  assert.match(data, /scope: "request" \| "message" \| "transition" \| "work"/, "Work keys must use the shared collision-safe key generator");
  assert.match(data, /createMomoClientRequestWork[\s\S]*?idempotencyKey: string;[\s\S]*?p_idempotency_key: input\.idempotencyKey/, "The work adapter must send the browser attempt key to the transactional RPC");
  assert.match(data, /"client_request_work_idempotency_conflict"/, "The adapter must preserve changed-retry conflicts");
  assert.match(center, /const \[workKey, setWorkKey\] = useState\(\(\) => newMomoRequestIdempotencyKey\("work"\)\)/);
  assert.match(center, /createMomoClientRequestWork\(\{[^}]*idempotencyKey: workKey/, "Retries of an unchanged work payload must reuse the same key");
  assert.match(center, /setWorkType\(event\.target\.value\); setWorkKey\(newMomoRequestIdempotencyKey\("work"\)\)/, "Changing work type must start a new attempt");
  assert.match(center, /setWorkPriority\(Number\(event\.target\.value\)\); setWorkKey\(newMomoRequestIdempotencyKey\("work"\)\)/, "Changing priority must start a new attempt");
  assert.match(center, /setWorkTitle\(event\.target\.value\); setWorkKey\(newMomoRequestIdempotencyKey\("work"\)\)/, "Changing title must start a new attempt");
  assert.match(center, /setWorkDescription\(event\.target\.value\); setWorkKey\(newMomoRequestIdempotencyKey\("work"\)\)/, "Changing details must start a new attempt");
  assert.match(center, /setWorkDueAt\(event\.target\.value\); setWorkKey\(newMomoRequestIdempotencyKey\("work"\)\)/, "Changing due time must start a new attempt");
  assert.match(center, /if \(result\.ok\) \{[\s\S]*?setWorkKey\(newMomoRequestIdempotencyKey\("work"\)\)/, "A successful work creation must retire its key");
  assert.match(center, /"client_request_work_idempotency_conflict"/, "Changed work retries must have a truthful UI message");
});

test("request-linked work remains visible on the ordinary Momo work board", async () => {
  const [data, center] = await Promise.all([readApp("momo-data.ts"), readApp("momo-operating-center.tsx")]);
  assert.match(data, /client_request_id, work_type/);
  assert.match(center, /item\.client_request_id &&/);
  assert.match(center, /Client request · \{item\.client_request_id\.slice\(0, 8\)\}/);
});
