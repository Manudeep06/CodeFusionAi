import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeFiles, hashFiles } from "../src/services/history.service.js";

test("normalizeFiles sorts by path, strips folder content and drops invalid entries", () => {
  const out = normalizeFiles([
    { path: "b.js", content: "2" },
    { path: "src", isFolder: true, content: "ignored" },
    { path: "a.js" },
    null,
    { content: "no path" },
  ]);
  assert.deepEqual(out, [
    { path: "a.js", isFolder: false, content: "", language: undefined },
    { path: "b.js", isFolder: false, content: "2", language: undefined },
    { path: "src", isFolder: true },
  ]);
});

test("hash is stable regardless of input order (so unchanged rooms don't create versions)", () => {
  const one = hashFiles(normalizeFiles([{ path: "a", content: "1" }, { path: "b", content: "2" }]));
  const two = hashFiles(normalizeFiles([{ path: "b", content: "2" }, { path: "a", content: "1" }]));
  assert.equal(one, two);
  assert.match(one, /^[a-f0-9]{64}$/);
});

test("hash changes when any file content changes", () => {
  const before = hashFiles(normalizeFiles([{ path: "a", content: "1" }]));
  const after = hashFiles(normalizeFiles([{ path: "a", content: "1 " }]));
  assert.notEqual(before, after);
});
