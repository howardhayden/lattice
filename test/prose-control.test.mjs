// Required Notice: Copyright 2026 Hayden Howard. All rights reserved.
// Register Material under REGISTER-LICENSE.md.
// These tests cover atomization structure and reference arithmetic, not reader effects.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const source = read("profiles/relational-systems.profile.json");
const profile = JSON.parse(source);
const controls = profile.rules.filter((rule) => rule.id.startsWith("RSR-CTL-"));
const doc = read("docs/prose-control.md");
const schema = JSON.parse(read("schemas/register-profile.schema.json"));
const gitBlob = (text) => createHash("sha1")
  .update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest("hex");
const originalProfileSha = "5480c377dbcf546df99f1ba819c48083dbf35937";
const allLayers = { exists: { field: "layer", value: true } };
const expressiveLayers = { in: { field: "layer", value: ["experiential", "interpretive"] } };
const expressive = new Set([4, 5, 6, 7, 8, 11]);
const ornamental = new Set([6, 7, 11]);

function restoredBaseline(text) {
  const boundary = text.indexOf(',\n    {\n      "id": "RSR-CTL-001"');
  assert.ok(boundary > 0, "missing additive control block boundary");
  return `${text.slice(0, boundary)}\n  ]\n}\n`
    .replace('"version": "v1.1.0"', '"version": "v1.0.0"');
}

function assertDependencyGraph(rules) {
  const graph = new Map(rules.map((rule) => [rule.id, rule.dependsOn]));
  assert.equal(graph.size, rules.length, "duplicate rule IDs");
  const visited = new Set();
  const active = new Set();
  function visit(id) {
    assert.ok(graph.has(id), `missing dependency ${id}`);
    assert.ok(!active.has(id), `dependency cycle at ${id}`);
    if (visited.has(id)) return;
    active.add(id);
    for (const dependency of graph.get(id)) visit(dependency);
    active.delete(id);
    visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
}

test("control atoms are additive to the exact byte-verified baseline", () => {
  assert.equal(gitBlob(restoredBaseline(source)), originalProfileSha);
  assert.equal(profile.rules.length, 87);
  assert.equal(controls.length, 18);
  assert.equal(profile.version, "v1.1.0");
});

test("source and distributed profile bytes agree", () => {
  assert.equal(read("dist/profiles/relational-systems.profile.json"), source);
});

test("baseline preservation check detects an inherited-rule mutation", () => {
  const mutant = source.replace("Remove redundant explanation", "Remove all explanation");
  assert.notEqual(gitBlob(restoredBaseline(mutant)), originalProfileSha);
});

test("all rule dependencies remain resolved and acyclic", () => {
  assertDependencyGraph(profile.rules);
});

test("dependency checks reject missing references and cycles", () => {
  const missing = structuredClone(profile.rules);
  missing.at(-1).dependsOn.push("RSR-MISSING-001");
  assert.throws(() => assertDependencyGraph(missing), /missing dependency/);
  const cycle = structuredClone(profile.rules);
  cycle.at(-1).dependsOn.push(cycle.at(-1).id);
  assert.throws(() => assertDependencyGraph(cycle), /dependency cycle/);
});

test("profile fields and rule choices stay in the current declarative vocabulary", () => {
  assert.ok(profile.rules.length <= schema.properties.rules.maxItems);
  for (const key of Object.keys(profile)) assert.ok(Object.hasOwn(schema.properties, key));
  for (const rule of profile.rules) {
    for (const key of Object.keys(rule)) assert.ok(Object.hasOwn(schema.$defs.rule.properties, key));
    for (const key of ["norm", "priority", "enforcement", "validatorId"]) {
      assert.ok(schema.$defs.rule.properties[key].enum.includes(rule[key]), `${rule.id}: ${key}`);
    }
  }
});

for (let index = 1; index <= 18; index += 1) {
  const suffix = String(index).padStart(3, "0");
  const id = `RSR-CTL-${suffix}`;
  test(`${id} has advisory, contextual, traceable atomization`, () => {
    const rule = controls.find((entry) => entry.id === id);
    assert.ok(rule);
    assert.equal(rule.revision, "r1");
    assert.equal(rule.norm, "prefer", "the norm must agree with the affirmative requirement");
    assert.equal(rule.validatorId, "manual-review");
    assert.equal(rule.enforcement, "advisory");
    assert.equal(rule.priority, ornamental.has(index) ? "ornament" : "register");
    assert.deepEqual(rule.params, {}, "no unsupported scoring or request fields");
    assert.deepEqual(rule.conflictsWith, [], "no inherited obligations superseded");
    assert.deepEqual(rule.appliesWhen, expressive.has(index) ? expressiveLayers : allLayers);
    assert.deepEqual(rule.dependsOn, [index === 1 ? "RSR-CORE-002" : index === 2 ? "RSR-CTL-001" : "RSR-CTL-002"]);
    assert.deepEqual(rule.tags, ornamental.has(index) ? ["ornament"] : index === 8 ? ["subtext"] : []);
    for (const kind of ["P", "N", "B"]) assert.ok(doc.includes(`CTL-${suffix}-${kind}`));
  });
}

test("specification states manual-review and mathematical authority limits", () => {
  for (const phrase of [
    "automated literary evaluation not implemented",
    "not newly supported request fields",
    "not a calibrated probability",
    "No sum crosses protected priorities",
    "do not renormalize weights",
    "not a total ordering of literature",
    "not claims of executed human-subject tests"
  ]) assert.ok(doc.includes(phrase), `missing authority boundary: ${phrase}`);
  for (let index = 1; index <= 6; index += 1) {
    assert.ok(doc.includes(`CTL-C-${String(index).padStart(3, "0")}`));
  }
  const register = read("docs/register-specification.md");
  assert.ok(register.includes("87 atomic rules"));
  assert.ok(register.includes("(prose-control.md)"));
  assert.ok(register.includes("(prose-control-verification.md)"));
});

test("current proprietary scope preserves exact pre-baseline manifest evidence", () => {
  const manifest = JSON.parse(read("license-scope.json"));
  const added = ["docs/prose-control.md", "docs/prose-control-verification.md", "test/prose-control.test.mjs"];
  const all = Object.values(manifest.scopes).flatMap((scope) => scope.files);
  assert.equal(all.length, new Set(all).size);
  for (const path of added) assert.ok(manifest.scopes["register-exclusive"].files.includes(path));
  assert.equal(manifest.scopes["engine-proprietary"].license, "LicenseRef-Hayden-Proprietary-1.1");
  assert.ok(manifest.scopes["license-administrative"].files.includes("COMMERCIAL_BASELINE.md"));
  assert.ok(manifest.scopes["license-administrative"].files.includes("LICENSES/Hayden-Proprietary-1.1.md"));
  assert.ok(manifest.scopes["license-administrative"].files.includes("LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md"));
  assert.ok(manifest.scopes["license-administrative"].files.includes("LICENSES/PolyForm-Noncommercial-1.0.0.md"));

  const historical = structuredClone(manifest);
  historical.version = "1.0.0";
  historical.scopes = {
    "register-exclusive": {
      ...historical.scopes["register-exclusive"],
      files: historical.scopes["register-exclusive"].files.filter((path) => !added.includes(path))
    },
    "engine-noncommercial": {
      ...historical.scopes["engine-proprietary"],
      license: "PolyForm-Noncommercial-1.0.0",
      terms: "LICENSES/PolyForm-Noncommercial-1.0.0.md"
    },
    "license-administrative": {
      ...historical.scopes["license-administrative"],
      files: historical.scopes["license-administrative"].files.filter((path) => ![
        "LICENSES/Hayden-Proprietary-1.1.md",
        "LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md",
        "COMMERCIAL_BASELINE.md"
      ].includes(path))
    }
  };
  assert.equal(gitBlob(`${JSON.stringify(historical, null, 2)}\n`), "1d79a88b5bc99d21dd933fd0c05548f180ce2e00");
});

// Executable reference examples for the document's arithmetic only.
// Nothing below is a production scoring API or a semantic evaluation function.
function referenceIntervalLoss(outcome, target, scale) {
  if (!Array.isArray(target) || target.length !== 2) return { status: "unknown" };
  const [lower, upper] = target;
  if (![outcome, lower, upper, scale].every(Number.isFinite) || lower > upper || scale <= 0) {
    return { status: "unknown" };
  }
  const distance = Math.max(lower - outcome, 0, outcome - upper);
  if (!Number.isFinite(distance)) return { status: "unknown" };
  return { status: "assessed", loss: Math.min(1, distance / scale) };
}

function referenceWithinTierMean(rows) {
  if (!rows.length) return { status: "not-applicable", coverage: null };
  const assessed = rows.filter((row) => row.status === "assessed").length;
  const coverage = assessed / rows.length;
  const unknown = { status: "unknown", coverage };
  if (new Set(rows.map((row) => row.tier)).size !== 1) return unknown;
  if (!rows.every((row) => ["register", "ornament"].includes(row.tier))) return unknown;
  if (!rows.every((row) => Number.isFinite(row.weight) && row.weight >= 0)) return unknown;
  if (Math.abs(rows.reduce((sum, row) => sum + row.weight, 0) - 1) > 1e-12) return unknown;
  if (assessed !== rows.length) return unknown;
  if (!rows.every((row) => Number.isFinite(row.loss) && row.loss >= 0 && row.loss <= 1)) return unknown;
  return { status: "assessed", coverage, loss: rows.reduce((sum, row) => sum + row.weight * row.loss, 0) };
}

test("reference interval loss is zero inside a declared band, including its edges", () => {
  for (const outcome of [2, 3, 4]) {
    assert.deepEqual(referenceIntervalLoss(outcome, [2, 4], 2), { status: "assessed", loss: 0 });
  }
});

test("reference interval loss is bounded and responds to deviation", () => {
  assert.equal(referenceIntervalLoss(1, [2, 4], 2).loss, 0.5);
  assert.equal(referenceIntervalLoss(5, [2, 4], 2).loss, 0.5);
  assert.equal(referenceIntervalLoss(20, [2, 4], 2).loss, 1);
});

test("reference interval loss never rewards absent or invalid evidence", () => {
  for (const args of [[3, [], 1], [3, [4, 2], 1], [3, [2, 4], 0], [3, [2, 4], -1], [NaN, [2, 4], 1], [3, [2, Infinity], 1], [3, [2, 4], Infinity], [null, [2, 4], 1]]) {
    assert.deepEqual(referenceIntervalLoss(...args), { status: "unknown" });
  }
});

test("reference interval arithmetic fails unknown on overflow", () => {
  assert.deepEqual(referenceIntervalLoss(-Number.MAX_VALUE, [Number.MAX_VALUE, Number.MAX_VALUE], 1), { status: "unknown" });
});

const assessedRows = () => [
  { tier: "register", status: "assessed", weight: 0.5, loss: 0.2 },
  { tier: "register", status: "assessed", weight: 0.5, loss: 0.4 }
];

test("reference mean uses fixed weights only within one tier", () => {
  const result = referenceWithinTierMean(assessedRows());
  assert.equal(result.status, "assessed");
  assert.equal(result.coverage, 1);
  assert.ok(Math.abs(result.loss - 0.3) < 1e-12);
});

test("reference mean preserves unknown coverage instead of renormalizing", () => {
  const rows = assessedRows();
  rows[1].status = "unknown";
  delete rows[1].loss;
  assert.deepEqual(referenceWithinTierMean(rows), { status: "unknown", coverage: 0.5 });
});

test("reference empty-set handling is not applicable, not perfect", () => {
  assert.deepEqual(referenceWithinTierMean([]), { status: "not-applicable", coverage: null });
});

test("reference aggregation rejects cross-tier and malformed numeric inputs", () => {
  for (const change of [
    (rows) => { rows[1].tier = "ornament"; },
    (rows) => { rows[0].tier = rows[1].tier = "safety"; },
    (rows) => { rows[1].weight = -0.5; },
    (rows) => { rows[1].weight = Infinity; },
    (rows) => { rows[1].weight = 0; },
    (rows) => { rows[1].loss = 1.2; },
    (rows) => { rows[1].loss = NaN; }
  ]) {
    const rows = assessedRows();
    change(rows);
    assert.equal(referenceWithinTierMean(rows).status, "unknown");
  }
});
