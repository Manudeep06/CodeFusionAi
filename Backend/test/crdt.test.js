import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as Y from "yjs";
import * as crdt from "../src/services/crdt.service.js";

const ROOM = "test-room";

/** A client replica synced from the server state. */
const client = () => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, crdt.encodeState(ROOM));
  const updates = [];
  doc.on("update", (u) => updates.push(u));
  return { doc, updates, text: (p) => doc.getMap("files").get(p) };
};

beforeEach(() => crdt._resetForTests());

test("seeds a document from workspace files (folders ignored)", () => {
  crdt.ensureDoc(ROOM, [{ path: "src", isFolder: true }, { path: "src/a.js", content: "hello" }]);
  assert.deepEqual([...crdt.getContents(ROOM)], [["src/a.js", "hello"]]);
});

test("concurrent edits to the same file converge on every replica", () => {
  crdt.ensureDoc(ROOM, [{ path: "a.js", content: "hello" }]);
  const a = client();
  const b = client();

  a.text("a.js").insert(5, " world"); // A appends
  b.text("a.js").insert(0, ">> ");    // B prepends at the same time

  for (const u of [...a.updates, ...b.updates]) assert.equal(crdt.applyClientUpdate(ROOM, u, "x"), true);
  b.updates.forEach((u) => Y.applyUpdate(a.doc, u));
  a.updates.forEach((u) => Y.applyUpdate(b.doc, u));

  const server = crdt.getContents(ROOM).get("a.js");
  assert.equal(server, ">> hello world");
  assert.equal(a.text("a.js").toString(), server);
  assert.equal(b.text("a.js").toString(), server);
});

test("reconcile keeps CRDT content, seeds new files and drops deleted ones", () => {
  crdt.ensureDoc(ROOM, [{ path: "a.js", content: "live" }, { path: "old.js", content: "x" }]);
  const { files, update } = crdt.reconcileFiles(ROOM, [
    { path: "a.js", content: "stale copy from a client" },
    { path: "new.js", content: "fresh" },
  ]);
  assert.deepEqual(files.map((f) => [f.path, f.content]), [["a.js", "live"], ["new.js", "fresh"]]);
  assert.ok(update instanceof Uint8Array);
  assert.equal(crdt.getContents(ROOM).has("old.js"), false);
});

test("replaceContents rewrites texts for a version restore", () => {
  crdt.ensureDoc(ROOM, [{ path: "a.js", content: "v2" }, { path: "b.js", content: "b" }]);
  const update = crdt.replaceContents(ROOM, [{ path: "a.js", content: "v1" }]);
  assert.ok(update);
  assert.deepEqual([...crdt.getContents(ROOM)], [["a.js", "v1"]]);
});

test("malformed client updates are rejected without throwing", () => {
  crdt.ensureDoc(ROOM, []);
  assert.equal(crdt.applyClientUpdate(ROOM, new Uint8Array([1, 2, 3, 255]), "x"), false);
  assert.equal(crdt.applyClientUpdate("unknown-room", new Uint8Array([0]), "x"), false);
});
