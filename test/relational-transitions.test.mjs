// Copyright 2026 Hayden Howard. All rights reserved.
// Reserved Register Material under RIGHTS-RESERVED.md.
// Structural/runtime checks do not certify editorial scenarios or audience effects.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { compileProfile, createEngine, verifyReceipt } from "../dist/index.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const source = read("profiles/relational-systems.profile.json");
const profile = JSON.parse(source);
const added = profile.rules.filter((rule) => rule.id.startsWith("RSR-DYN-"));
const doc = read("docs/relational-transitions.md");
const manifest = JSON.parse(read("license-scope.json"));
const reserved = manifest.scopes["owner-reserved"];
const blob = (value) => createHash("sha1").update(`blob ${Buffer.byteLength(value)}\0`).update(value).digest("hex");

function inherited(text) {
  const boundary = text.indexOf(',\n    {\n      "id": "RSR-DYN-001"');
  assert.ok(boundary > 0);
  return `${text.slice(0, boundary)}\n  ]\n}\n`.replace('"version": "v1.2.0"', '"version": "v1.1.0"');
}

function request(layer, mode = "consequence", representation = "standard") {
  const action = ["care", "action", "movement"].includes(mode);
  const text = action ? "Inspect the handover record." : "The handover record remains available.";
  return {
    id: "transition-fixture",
    contract: {
      id: "transition-contract", revision: "1", relations: [], prohibitedClaims: [], terminology: {},
      atoms: [{
        id: "record", kind: action ? "action" : "state", criticality: "contextual",
        frame: { subject: action ? "user" : "the handover record", predicate: action ? "inspect" : "remains", object: action ? "the handover record" : "available", polarity: "positive", modality: action ? "must" : "is", conditionIds: [] },
        requiredIn: [layer], delivery: { [layer]: "explicit" }, protectedFields: [], prohibitedDependencies: [],
        literalForm: text, match: { allOf: action ? ["inspect", "handover record"] : ["handover record", "available"] }
      }]
    },
    context: {
      domain: "handover-review", surface: "summary", mode, stakes: "ambient", safetyClass: "none", locale: "en-US",
      audience: { knowledgeTags: [] },
      channel: { visualAvailable: true, audioAvailable: true, spatialInferenceAllowed: true }
    },
    outputs: [{ layer, representation }]
  };
}

test("transition atoms preserve the exact inherited 87-rule profile", () => {
  assert.equal(blob(inherited(source)), "9e3dfc98db7965517419393b38ee650878d6b813");
  assert.equal(profile.version, "v1.2.0");
  assert.equal(profile.rules.length, 94);
  assert.equal(added.length, 7);
  compileProfile(profile);
});

test("preservation detects a mutation in the inherited control block", () => {
  const mutant = source.replace("Preserve target-relative control", "Ignore target-relative control");
  // Select a known inherited description directly if wording differs.
  const inheritedRule = profile.rules.find((rule) => rule.id === "RSR-CTL-002");
  const altered = mutant === source ? source.replace(inheritedRule.description, `${inheritedRule.description} Changed.`) : mutant;
  assert.notEqual(blob(inherited(altered)), "9e3dfc98db7965517419393b38ee650878d6b813");
});

for (let index = 1; index <= 7; index += 1) {
  const suffix = String(index).padStart(3, "0");
  test(`RSR-DYN-${suffix} is advisory, contextual, and traceable`, () => {
    const rule = added.find((entry) => entry.id === `RSR-DYN-${suffix}`);
    assert.equal(rule.revision, "r1");
    assert.equal(rule.norm, "prefer");
    assert.equal(rule.priority, "register");
    assert.equal(rule.enforcement, "advisory");
    assert.equal(rule.validatorId, "manual-review");
    assert.deepEqual(rule.appliesWhen, { in: { field: "layer", value: ["experiential", "interpretive"] } });
    assert.deepEqual(rule.dependsOn, ["RSR-CTL-002"]);
    assert.deepEqual(rule.conflictsWith, []);
    assert.deepEqual(rule.params, {});
    assert.deepEqual(rule.tags, []);
    for (const kind of ["P", "N", "B"]) assert.ok(doc.includes(`DYN-${suffix}-${kind}`));
  });
}

test("mechanisms and combination probes retain bounded review authority", () => {
  assert.equal((doc.match(/\| `RT-M\d{2}`/gu) ?? []).length, 26);
  for (let index = 1; index <= 6; index += 1) assert.ok(doc.includes(`DYN-C-${String(index).padStart(3, "0")}`));
  for (const phrase of ["genre-neutral", "semantic opportunity", "unknown", "not applicable", "not newly supported request fields",
    "No automatic semantic judgment", "not certified audience responses", "motifs remain optional", "no darker consequence",
    "Immediate revision", "Operative instructions", "accessibility equivalent", "Do not double-count"]) {
    if (phrase === "Immediate revision") assert.ok(doc.includes("immediate revision"));
    else assert.ok(doc.includes(phrase), `missing boundary: ${phrase}`);
  }
});

for (const layer of ["experiential", "interpretive"]) {
  test(`${layer} findings stay unknown across different delivery modes`, () => {
    for (const mode of ["consequence", "care", "action", "movement"]) {
      const result = createEngine().realize(request(layer, mode));
      const decisions = result.outputs[0].ruleDecisions.filter((entry) => entry.ruleId.startsWith("RSR-DYN-"));
      assert.equal(decisions.length, 7);
      for (const decision of decisions) {
        assert.equal(decision.disposition, "applied");
        assert.equal(decision.findingStatus, "unknown");
        assert.equal(decision.findingCode, "M_MANUAL_REVIEW");
      }
      verifyReceipt(result.receipt);
    }
  });
}

test("operative output keeps all transition controls inapplicable", () => {
  const result = createEngine().realize(request("operative"));
  const decisions = result.outputs[0].ruleDecisions.filter((entry) => entry.ruleId.startsWith("RSR-DYN-"));
  assert.equal(decisions.length, 7);
  for (const decision of decisions) {
    assert.equal(decision.disposition, "inapplicable");
    assert.equal(decision.findingStatus, null);
  }
});

test("accessibility-equivalent output retains required meaning and unknown review", () => {
  const result = createEngine().realize(request("interpretive", "consequence", "accessibility-equivalent"));
  assert.equal(result.outputs[0].text, "The handover record remains available.");
  assert.ok(result.outputs[0].ruleDecisions.filter((entry) => entry.ruleId.startsWith("RSR-DYN-")).every((entry) => entry.findingStatus === "unknown"));
});

test("unknown transition review cannot excuse a prohibited permission claim", () => {
  const value = request("interpretive");
  value.contract.prohibitedClaims = [{ id: "ungranted-permission", literalForm: "This grants permission for every future use." }];
  value.candidates = [{ id: "unsupported", layer: "interpretive", representation: "standard",
    text: "The handover record remains available. This grants permission for every future use.", atomIds: ["record"], metadata: {} }];
  assert.throws(() => createEngine().realize(value), (error) => error.code === "E_CANDIDATE_EXHAUSTED");
});

test("reserved revisions offer no new grant and retain register identity", () => {
  assert.equal(manifest.version, "2.1.0");
  assert.equal(reserved.license, "LicenseRef-Hayden-All-Rights-Reserved");
  assert.equal(reserved.terms, "RIGHTS-RESERVED.md");
  assert.equal(new Set(reserved.registerFiles).size, reserved.registerFiles.length);
  for (const path of reserved.registerFiles) assert.ok(reserved.files.includes(path));
  for (const path of ["profiles/relational-systems.profile.json", "dist/profiles/relational-systems.profile.json",
    "docs/register-specification.md", "docs/relational-transitions.md", "docs/relational-transitions-verification.md",
    "test/prose-control.test.mjs", "test/relational-transitions.test.mjs"]) assert.ok(reserved.registerFiles.includes(path));
  for (const path of ["RIGHTS-RESERVED.md", "license-scope.json", "LICENSE.md", "scripts/check.mjs", "schemas/license-scope.schema.json",
    "README.md", "CHANGELOG.md", "docs/licensing.md", "docs/license-requirements.md", "test/fixtures/license-scope.v2.json"]) assert.ok(reserved.files.includes(path));
  const paths = Object.values(manifest.scopes).flatMap((scope) => scope.files);
  assert.equal(paths.length, new Set(paths).size);
  for (const phrase of ["No new contractual permission is granted", "Applicable law", "applicable platform rights",
    "Third-party materials retain their own terms", "does not revoke those permissions", "does not claim ownership of unprotected ideas"]) {
    assert.ok(read(reserved.terms).includes(phrase));
  }
});

test("unchanged classifications and exact full term texts remain preserved", () => {
  const previous = JSON.parse(read("test/fixtures/license-scope.v2.json"));
  const current = new Map(Object.entries(manifest.scopes).flatMap(([scope, value]) => value.files.map((path) => [path, scope])));
  for (const [scope, value] of Object.entries(previous.scopes)) {
    for (const path of value.files) assert.equal(current.get(path), reserved.files.includes(path) ? "owner-reserved" : scope);
  }
  const exactTerms = {
    "REGISTER-LICENSE.md": "b10f2611d3d52ec230dffd6875f68c46e2930c71",
    "LICENSES/Hayden-Proprietary-1.1.md": "97b9077e334f58c0023153b8d36f8ad8618383e2",
    "LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md": "938f45b8eaf11b1d82e4b8d3b073e9f9b435673c",
    "LICENSES/PolyForm-Noncommercial-1.0.0.md": "5ecc88cfc4b1cff608ed640efe913c9dd97935c3"
  };
  for (const [path, expected] of Object.entries(exactTerms)) assert.equal(blob(read(path)), expected);
});
