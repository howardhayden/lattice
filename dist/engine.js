import { ENGINE_VERSION, EVIDENCE_SCHEMA_VERSION, Limits, Priority } from "./constants.js";
import { normalizeOutputs, protectedTags, validateContext } from "./context.js";
import { FailureCode, invariant, LatticeError } from "./errors.js";
import { compileProfile, resolveRules } from "./profile.js";
import { coverageFor, literalize, outputKey, requiredAtomsFor, validateContract } from "./semantic.js";
import { findingPenalty, runHardGates, runRuleValidator } from "./validators.js";
import { assertIdentifier, assertPlainData, compareRank, deepFreeze, digest, normalizeText, splitSentences, stableStringify, unique } from "./util.js";
import { relationalSystemsDefinition } from "./relational-systems.js";

const ENGINE_NAME = "Lattice — Layered Register Engine";
const CONFORMANCE_ORDER = Object.freeze({ full: 2, degraded: 1, literal: 0 });
const DEPENDENCY_KINDS = new Set(["imagery", "color", "sound", "direction", "timing-perception", "implication", "spatial-inference"]);

function copyPlain(value, label = "input") {
  assertPlainData(value, label);
  return structuredClone(value);
}

function profileDefinition(profile) {
  const plain = copyPlain(profile, "profile");
  delete plain.digest;
  return plain;
}

function compileProfiles(profiles) {
  invariant(Array.isArray(profiles) && profiles.length > 0, FailureCode.PROFILE_CONFLICT, "At least one declarative profile is required.");
  invariant(profiles.length <= Limits.maxProfiles, FailureCode.EXECUTION_BOUND, "The engine contains too many profiles.");
  const compiled = profiles.map((profile) => compileProfile(profileDefinition(profile)));
  invariant(compiled.reduce((count, profile) => count + profile.rules.length, 0) <= Limits.maxActiveRules, FailureCode.EXECUTION_BOUND, "The engine contains too many active profile rules.");
  const ids = new Set();
  for (const profile of compiled) {
    invariant(!ids.has(profile.id), FailureCode.PROFILE_CONFLICT, "Profile IDs must be unique within an engine.", { profileId: profile.id });
    ids.add(profile.id);
  }
  for (let leftProfile = 0; leftProfile < compiled.length; leftProfile += 1) {
    for (let rightProfile = leftProfile + 1; rightProfile < compiled.length; rightProfile += 1) {
      for (const left of compiled[leftProfile].rules) {
        for (const right of compiled[rightProfile].rules) {
          const opposing = new Set([left.norm, right.norm]);
          const exactHardConflict = left.enforcement === "hard"
            && right.enforcement === "hard"
            && left.validatorId === right.validatorId
            && left.priority === right.priority
            && opposing.has("must")
            && opposing.has("mustNot")
            && stableStringify(left.appliesWhen) === stableStringify(right.appliesWhen);
          invariant(!exactHardConflict, FailureCode.PROFILE_CONFLICT, "Profiles contain an unsatisfiable cross-profile hard conflict.", {
            profileIds: [compiled[leftProfile].id, compiled[rightProfile].id],
            ruleIds: [left.id, right.id]
          });
        }
      }
    }
  }
  return compiled.sort((left, right) => left.id.localeCompare(right.id) || left.version.localeCompare(right.version));
}

function selectProfiles(registry, profileIds) {
  if (profileIds === undefined) return registry;
  invariant(Array.isArray(profileIds) && profileIds.length > 0, FailureCode.PROFILE_CONFLICT, "profileIds must be a non-empty array when provided.");
  invariant(profileIds.length <= Limits.maxProfiles, FailureCode.EXECUTION_BOUND, "The request selects too many profiles.");
  invariant(unique(profileIds).length === profileIds.length, FailureCode.PROFILE_CONFLICT, "profileIds contains duplicates.");
  const selected = profileIds.map((id) => {
    assertIdentifier(id, "Profile ID");
    const profile = registry.find((entry) => entry.id === id);
    invariant(profile, FailureCode.PROFILE_CONFLICT, "The request selects an unregistered profile.", { profileId: id });
    return profile;
  });
  return selected.sort((left, right) => left.id.localeCompare(right.id));
}

function validateMetadata(metadata, candidateId) {
  const value = metadata ?? {};
  assertPlainData(value, `Candidate ${candidateId} metadata`);
  invariant(value && typeof value === "object" && !Array.isArray(value), FailureCode.INVALID_INPUT, `Candidate ${candidateId} metadata must be an object.`);
  for (const field of ["dependencies", "stateChanges", "speakers", "affectedParties", "sensoryAnchors", "narrativeLayers", "causalLinks"]) {
    if (value[field] !== undefined) invariant(Array.isArray(value[field]), FailureCode.INVALID_INPUT, `Candidate ${candidateId} metadata.${field} must be an array.`);
  }
  if (value.dependencies !== undefined) invariant(value.dependencies.length <= DEPENDENCY_KINDS.size, FailureCode.EXECUTION_BOUND, `Candidate ${candidateId} declares too many dependencies.`);
  for (const field of ["stateChanges", "speakers", "affectedParties", "sensoryAnchors", "narrativeLayers"]) {
    if (value[field] !== undefined) invariant(value[field].length <= 256, FailureCode.EXECUTION_BOUND, `Candidate ${candidateId} metadata.${field} contains too many entries.`);
  }
  if (value.causalLinks !== undefined) invariant(value.causalLinks.length <= Limits.maxRelations, FailureCode.EXECUTION_BOUND, `Candidate ${candidateId} contains too many causal links.`);
  for (const field of ["dependencies", "stateChanges", "speakers", "affectedParties", "sensoryAnchors", "narrativeLayers"]) {
    if (value[field] === undefined) continue;
    value[field] = value[field].map((entry) => normalizeText(entry, `Candidate ${candidateId} metadata.${field}`).trim());
    invariant(value[field].every((entry) => entry.length > 0), FailureCode.INVALID_INPUT, `Candidate ${candidateId} metadata.${field} contains an empty value.`);
    invariant(unique(value[field]).length === value[field].length, FailureCode.INVALID_INPUT, `Candidate ${candidateId} metadata.${field} contains duplicates.`);
  }
  if (value.dependencies !== undefined) invariant(value.dependencies.every((dependency) => DEPENDENCY_KINDS.has(dependency)), FailureCode.INVALID_INPUT, `Candidate ${candidateId} declares an unsupported dependency.`);
  if (value.focalizerId !== undefined) assertIdentifier(value.focalizerId, `Candidate ${candidateId} focalizer ID`);
  if (value.speakerObjectives !== undefined) {
    invariant(value.speakerObjectives && typeof value.speakerObjectives === "object" && !Array.isArray(value.speakerObjectives), FailureCode.INVALID_INPUT, `Candidate ${candidateId} speakerObjectives must be an object.`);
    for (const [speaker, objective] of Object.entries(value.speakerObjectives)) {
      assertIdentifier(speaker, `Candidate ${candidateId} speaker objective key`);
      value.speakerObjectives[speaker] = normalizeText(objective, `Candidate ${candidateId} speaker objective`).trim();
      invariant(value.speakerObjectives[speaker].length > 0, FailureCode.INVALID_INPUT, `Candidate ${candidateId} contains an empty speaker objective.`);
    }
  }
  if (value.actionGraph !== undefined) {
    invariant(value.actionGraph && typeof value.actionGraph === "object" && !Array.isArray(value.actionGraph), FailureCode.INVALID_INPUT, `Candidate ${candidateId} actionGraph must be an object.`);
    for (const field of ["actor", "action", "result"]) invariant(typeof value.actionGraph[field] === "string" && value.actionGraph[field].trim(), FailureCode.INVALID_INPUT, `Candidate ${candidateId} actionGraph.${field} is required.`);
  }
  if (value.claims !== undefined) {
    invariant(Array.isArray(value.claims), FailureCode.INVALID_INPUT, `Candidate ${candidateId} metadata.claims must be an array.`);
    invariant(value.claims.length <= Limits.maxAtoms, FailureCode.EXECUTION_BOUND, `Candidate ${candidateId} contains too many claims.`);
    for (const claim of value.claims) {
      invariant(claim && typeof claim === "object" && !Array.isArray(claim), FailureCode.INVALID_INPUT, `Candidate ${candidateId} contains an invalid claim record.`);
      assertIdentifier(claim.id, `Candidate ${candidateId} claim ID`);
      invariant(typeof claim.status === "string", FailureCode.INVALID_INPUT, `Candidate ${candidateId} claim ${claim.id} requires a status.`);
      invariant(Array.isArray(claim.atomIds) && claim.atomIds.length > 0, FailureCode.INVALID_INPUT, `Candidate ${candidateId} claim ${claim.id} requires atomIds.`);
      claim.atomIds.forEach((id) => assertIdentifier(id, `Candidate ${candidateId} claim atom ID`));
      invariant(unique(claim.atomIds).length === claim.atomIds.length, FailureCode.INVALID_INPUT, `Candidate ${candidateId} claim ${claim.id} contains duplicate atomIds.`);
      if (claim.evidenceRefs !== undefined) {
        invariant(Array.isArray(claim.evidenceRefs) && claim.evidenceRefs.length > 0, FailureCode.INVALID_INPUT, `Candidate ${candidateId} claim ${claim.id} evidenceRefs must be a non-empty array.`);
        claim.evidenceRefs = claim.evidenceRefs.map((reference) => normalizeText(reference, `Candidate ${candidateId} claim evidence reference`).trim());
        invariant(claim.evidenceRefs.every(Boolean) && unique(claim.evidenceRefs).length === claim.evidenceRefs.length, FailureCode.INVALID_INPUT, `Candidate ${candidateId} claim ${claim.id} has invalid evidenceRefs.`);
      }
    }
  }
  return value;
}

function validateCandidates(candidates, outputs, context) {
  const value = candidates ?? [];
  invariant(Array.isArray(value), FailureCode.INVALID_INPUT, "candidates must be an array.");
  invariant(value.length <= (context.limits?.maxCandidates ?? Limits.maxCandidates), FailureCode.EXECUTION_BOUND, "The request contains too many candidates.");
  const outputKeys = new Set(outputs.map(outputKey));
  const ids = new Set();
  return value.map((source) => {
    invariant(source && typeof source === "object" && !Array.isArray(source), FailureCode.INVALID_INPUT, "Each candidate must be an object.");
    assertIdentifier(source.id, "Candidate ID");
    invariant(!ids.has(source.id), FailureCode.INVALID_INPUT, "Candidate IDs must be unique.", { candidateId: source.id });
    ids.add(source.id);
    const key = outputKey(source);
    invariant(outputKeys.has(key), FailureCode.UNSUPPORTED_CONTEXT, "A candidate targets an output that was not requested.", { candidateId: source.id, outputKey: key });
    const text = normalizeText(source.text, `Candidate ${source.id} text`).trim();
    invariant(text.length > 0, FailureCode.INVALID_INPUT, `Candidate ${source.id} text cannot be empty.`);
    invariant(text.length <= (context.limits?.maxCharacters ?? Limits.maxOutputCharacters), FailureCode.EXECUTION_BOUND, `Candidate ${source.id} text exceeds the contextual limit.`);
    invariant(Array.isArray(source.atomIds), FailureCode.INVALID_INPUT, `Candidate ${source.id} atomIds must be an array.`);
    source.atomIds.forEach((id) => assertIdentifier(id, `Candidate ${source.id} atom ID`));
    invariant(unique(source.atomIds).length === source.atomIds.length, FailureCode.INVALID_INPUT, `Candidate ${source.id} atomIds contains duplicates.`);
    return {
      id: source.id,
      layer: source.layer,
      representation: source.representation,
      text,
      atomIds: [...source.atomIds],
      metadata: validateMetadata(source.metadata, source.id),
      source: { kind: "provided" }
    };
  }).sort((left, right) => digest(left).localeCompare(digest(right)) || left.id.localeCompare(right.id));
}

function literalCandidate(contract, output) {
  const atoms = requiredAtomsFor(contract, output);
  const text = literalize(contract, output).trim();
  return {
    id: `literal-${output.layer}-${output.representation}`,
    layer: output.layer,
    representation: output.representation,
    text,
    atomIds: atoms.map((atom) => atom.id),
    metadata: {
      dependencies: [],
      claims: [],
      stateChanges: atoms.map((atom) => atom.id)
    },
    source: { kind: "literal" }
  };
}

function penaltyByPriority(findings, decisions, priority) {
  let total = 0;
  for (const decision of decisions) {
    if (decision.rule.priority !== priority || !decision.finding) continue;
    total += findingPenalty(decision.finding);
  }
  for (const result of findings) {
    if (result.status === "fail") total += 1_000;
  }
  return total;
}

function buildRank(coverage, hardFindings, ruleDecisions) {
  const accessibilityPass = hardFindings.some((finding) => finding.ruleId === "LRE-ACC-001" && finding.status === "pass") ? 1 : 0;
  return [
    hardFindings.some((finding) => finding.status === "fail") ? 0 : 1,
    coverage.ratio,
    accessibilityPass,
    -penaltyByPriority(hardFindings, ruleDecisions, "clarity"),
    -penaltyByPriority(hardFindings, ruleDecisions, "domain"),
    -penaltyByPriority(hardFindings, ruleDecisions, "register"),
    -penaltyByPriority(hardFindings, ruleDecisions, "ornament")
  ];
}

function evaluateCandidate(candidate, contract, context, output, profiles) {
  const coverage = coverageFor(contract, output, candidate);
  const environment = { ...context, layer: output.layer, representation: output.representation, contract, context, output, coverage };
  const hardFindings = runHardGates(candidate, { contract, context, output, coverage });
  if (splitSentences(candidate.text).length > (context.limits?.maxSentences ?? 1000)) {
    hardFindings.push({ ruleId: "LRE-BND-002", status: "fail", code: FailureCode.EXECUTION_BOUND, message: "Candidate exceeds the output sentence bound.", data: {} });
  }
  const ruleDecisions = [];
  for (const profile of profiles) {
    for (const resolution of resolveRules(profile, environment, protectedTags(context, output))) {
      const record = { profileId: profile.id, rule: resolution.rule, disposition: resolution.disposition, reason: resolution.reason, finding: null };
      ruleDecisions.push(record);
    }
  }
  const appliedHard = ruleDecisions.filter((decision) => decision.disposition === "applied" && decision.rule.enforcement === "hard");
  for (let leftIndex = 0; leftIndex < appliedHard.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < appliedHard.length; rightIndex += 1) {
      const left = appliedHard[leftIndex];
      const right = appliedHard[rightIndex];
      const opposing = new Set([left.rule.norm, right.rule.norm]);
      const incompatible = left.rule.validatorId === right.rule.validatorId
        && left.rule.priority === right.rule.priority
        && opposing.has("must")
        && opposing.has("mustNot");
      invariant(!incompatible, FailureCode.PROFILE_CONFLICT, "Applied profiles contain an unsatisfiable cross-profile hard conflict.", {
        profileIds: [left.profileId, right.profileId],
        ruleIds: [left.rule.id, right.rule.id]
      });
    }
  }
  for (const decision of ruleDecisions) {
    if (decision.disposition === "applied") decision.finding = runRuleValidator(candidate, decision.rule, environment);
  }
  const rank = buildRank(coverage, hardFindings, ruleDecisions);
  const rejectionCodes = unique([
    ...hardFindings.filter((finding) => finding.status === "fail").map((finding) => finding.code),
    ...ruleDecisions.filter((decision) => decision.finding?.status === "fail").map((decision) => decision.finding.code)
  ]).sort();
  const admissible = rejectionCodes.length === 0;
  const advisory = ruleDecisions.some((decision) => ["warn", "unknown"].includes(decision.finding?.status));
  const { id: _candidateId, ...candidateContent } = candidate;
  return { candidate, coverage, hardFindings, ruleDecisions, rank, rejectionCodes, admissible, advisory, digest: digest(candidateContent) };
}

function chooseCandidate(evaluations, key, hadProvidedCandidates) {
  const admissible = evaluations.filter((evaluation) => evaluation.admissible)
    .sort((left, right) => compareRank(left.rank, right.rank) || left.digest.localeCompare(right.digest) || left.candidate.id.localeCompare(right.candidate.id));
  if (!admissible.length) {
    throw new LatticeError(FailureCode.CANDIDATE_EXHAUSTED, "No candidate satisfies the hard realization contract.", {
      outputKey: key,
      supplied: hadProvidedCandidates,
      candidates: evaluations.map((evaluation) => ({ candidateId: evaluation.candidate.id, rejectionCodes: evaluation.rejectionCodes }))
    });
  }
  return admissible[0];
}

function publicDecision(outputKeyValue, decision, candidateId) {
  return {
    outputKey: outputKeyValue,
    candidateId,
    profileId: decision.profileId,
    ruleId: decision.rule.id,
    disposition: decision.disposition,
    reason: decision.reason,
    findingStatus: decision.finding?.status ?? null,
    findingCode: decision.finding?.code ?? null
  };
}

function publicFinding(finding) {
  return {
    ruleId: finding.ruleId,
    status: finding.status,
    code: finding.code,
    message: finding.message,
    data: finding.data
  };
}

function resultConformance(evaluation) {
  if (evaluation.candidate.source.kind === "literal") return "literal";
  return evaluation.advisory ? "degraded" : "full";
}

function ensureAccessibilityParity(selected, contract) {
  const byKey = new Map(selected.map((entry) => [outputKey(entry.output), entry]));
  for (const accessible of selected.filter((entry) => entry.output.representation === "accessibility-equivalent")) {
    const standard = byKey.get(`${accessible.output.layer}:standard`);
    invariant(standard, FailureCode.ACCESSIBILITY_GAP, "Accessibility equivalence requires a standard comparison output.", { layer: accessible.output.layer });
    const known = new Set(contract.atoms.map((atom) => atom.id));
    const standardIds = standard.evaluation.candidate.atomIds.filter((id) => known.has(id)).sort();
    const accessibleIds = accessible.evaluation.candidate.atomIds.filter((id) => known.has(id)).sort();
    invariant(stableStringify(standardIds) === stableStringify(accessibleIds), FailureCode.ACCESSIBILITY_GAP, "Accessibility-equivalent output does not preserve the standard output's semantic atom set.", {
      layer: accessible.output.layer,
      standardAtomIds: standardIds,
      accessibleAtomIds: accessibleIds
    });
  }
}

function makeReceipt(requestId, inputDigest, profiles, outputs, evaluationsByOutput) {
  const candidates = [];
  const decisions = [];
  for (const item of evaluationsByOutput) {
    for (const evaluation of item.evaluations) {
      candidates.push({
        outputKey: item.key,
        candidateId: evaluation.candidate.id,
        digest: evaluation.digest,
        selected: evaluation === item.selected,
        source: evaluation.candidate.source.kind,
        rank: evaluation.rank,
        rejectionCodes: evaluation.rejectionCodes
      });
      decisions.push(...evaluation.ruleDecisions.map((decision) => publicDecision(item.key, decision, evaluation.candidate.id)));
    }
  }
  invariant(decisions.length <= Limits.maxReceiptDecisions, FailureCode.EXECUTION_BOUND, "Receipt decision evidence exceeds the configured bound.");
  const body = {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    engine: { name: ENGINE_NAME, version: ENGINE_VERSION },
    requestId,
    runId: `r${digest({ inputDigest, profiles: profiles.map((profile) => profile.digest) }).slice(0, 23)}`,
    inputDigest,
    dependencies: { profileDigests: profiles.map((profile) => ({ id: profile.id, version: profile.version, digest: profile.digest })) },
    outputs: outputs.map((output) => ({
      key: output.key,
      candidateId: output.candidateId,
      digest: digest(output),
      conformance: output.conformance
    })),
    candidates,
    decisions,
    assurance: {
      deterministic: true,
      networkIndependent: true,
      semanticScope: "declared-contract-and-registered-claims",
      externallyAnchored: false
    },
    trustScope: "reproducibility-and-conformance-only"
  };
  return deepFreeze({ ...body, derivationDigest: digest(body) });
}

const receiptRootFields = ["schemaVersion", "engine", "requestId", "runId", "inputDigest", "dependencies", "outputs", "candidates", "decisions", "assurance", "trustScope", "derivationDigest"];
const outputReceiptFields = ["key", "candidateId", "digest", "conformance"];
const candidateReceiptFields = ["outputKey", "candidateId", "digest", "selected", "source", "rank", "rejectionCodes"];
const decisionReceiptFields = ["outputKey", "candidateId", "profileId", "ruleId", "disposition", "reason", "findingStatus", "findingCode"];
const receiptOutputKeys = new Set(["operative:standard", "operative:accessibility-equivalent", "experiential:standard", "experiential:accessibility-equivalent", "interpretive:standard", "interpretive:accessibility-equivalent"]);
const receiptIdentifierPattern = /^[A-Za-z][A-Za-z0-9._:@-]*$/u;
const receiptVersionPattern = /^[0-9A-Za-z][0-9A-Za-z._+-]*$/u;
const receiptDigestPattern = /^[a-f0-9]{64}$/u;

function exactReceiptObject(value, fields, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), FailureCode.RECEIPT_TAMPERED, `${label} must be an object.`);
  const expected = new Set(fields);
  const observed = Object.keys(value);
  invariant(observed.length === expected.size && observed.every((field) => expected.has(field)), FailureCode.RECEIPT_TAMPERED, `${label} contains missing or unsupported fields.`, { expected: [...expected], observed });
}

function verifyReceiptStructure(value) {
  exactReceiptObject(value, receiptRootFields, "Receipt");
  invariant(receiptIdentifierPattern.test(value.requestId), FailureCode.RECEIPT_TAMPERED, "Receipt requestId is invalid.");
  invariant(/^r[a-f0-9]{23}$/u.test(value.runId), FailureCode.RECEIPT_TAMPERED, "Receipt runId is invalid.");
  invariant(receiptDigestPattern.test(value.inputDigest) && receiptDigestPattern.test(value.derivationDigest), FailureCode.RECEIPT_TAMPERED, "Receipt digest fields are invalid.");

  exactReceiptObject(value.engine, ["name", "version"], "Receipt engine");
  invariant(value.engine.name === ENGINE_NAME && value.engine.version === ENGINE_VERSION && receiptVersionPattern.test(value.engine.version), FailureCode.RECEIPT_TAMPERED, "Receipt engine identity is unsupported.");

  exactReceiptObject(value.dependencies, ["profileDigests"], "Receipt dependencies");
  invariant(Array.isArray(value.dependencies.profileDigests) && value.dependencies.profileDigests.length > 0 && value.dependencies.profileDigests.length <= Limits.maxProfiles, FailureCode.RECEIPT_TAMPERED, "Receipt profile dependencies are invalid.");
  const profileIds = new Set();
  for (const profile of value.dependencies.profileDigests) {
    exactReceiptObject(profile, ["id", "version", "digest"], "Receipt profile dependency");
    invariant(receiptIdentifierPattern.test(profile.id) && receiptVersionPattern.test(profile.version) && receiptDigestPattern.test(profile.digest), FailureCode.RECEIPT_TAMPERED, "Receipt profile dependency is invalid.");
    invariant(!profileIds.has(profile.id), FailureCode.RECEIPT_TAMPERED, "Receipt contains duplicate profile dependencies.", { profileId: profile.id });
    profileIds.add(profile.id);
  }

  invariant(Array.isArray(value.outputs) && value.outputs.length > 0 && value.outputs.length <= 6, FailureCode.RECEIPT_TAMPERED, "Receipt outputs are invalid.");
  const outputs = new Map();
  for (const output of value.outputs) {
    exactReceiptObject(output, outputReceiptFields, "Receipt output");
    invariant(receiptOutputKeys.has(output.key) && receiptIdentifierPattern.test(output.candidateId) && receiptDigestPattern.test(output.digest), FailureCode.RECEIPT_TAMPERED, "Receipt output contains invalid values.");
    invariant(["full", "degraded", "literal"].includes(output.conformance), FailureCode.RECEIPT_TAMPERED, "Receipt output conformance is invalid.");
    invariant(!outputs.has(output.key), FailureCode.RECEIPT_TAMPERED, "Receipt contains duplicate output keys.", { outputKey: output.key });
    outputs.set(output.key, output);
  }

  invariant(Array.isArray(value.candidates) && value.candidates.length >= value.outputs.length && value.candidates.length <= Limits.maxCandidates + 6, FailureCode.RECEIPT_TAMPERED, "Receipt candidate evidence is invalid.");
  const candidates = new Map();
  const selectedByOutput = new Map();
  for (const candidate of value.candidates) {
    exactReceiptObject(candidate, candidateReceiptFields, "Receipt candidate decision");
    invariant(outputs.has(candidate.outputKey) && receiptIdentifierPattern.test(candidate.candidateId) && receiptDigestPattern.test(candidate.digest), FailureCode.RECEIPT_TAMPERED, "Receipt candidate decision contains invalid references.");
    invariant(typeof candidate.selected === "boolean" && ["provided", "literal"].includes(candidate.source), FailureCode.RECEIPT_TAMPERED, "Receipt candidate decision contains invalid state.");
    invariant(Array.isArray(candidate.rank) && candidate.rank.length === 7 && candidate.rank.every((entry) => typeof entry === "number" && Number.isFinite(entry)), FailureCode.RECEIPT_TAMPERED, "Receipt candidate rank is invalid.");
    invariant(Array.isArray(candidate.rejectionCodes) && candidate.rejectionCodes.every((code) => typeof code === "string" && receiptIdentifierPattern.test(code)) && unique(candidate.rejectionCodes).length === candidate.rejectionCodes.length, FailureCode.RECEIPT_TAMPERED, "Receipt candidate rejection codes are invalid.");
    const tuple = `${candidate.outputKey}\u0000${candidate.candidateId}`;
    invariant(!candidates.has(tuple), FailureCode.RECEIPT_TAMPERED, "Receipt contains duplicate candidate decisions.", { outputKey: candidate.outputKey, candidateId: candidate.candidateId });
    candidates.set(tuple, candidate);
    if (candidate.selected) {
      invariant(!selectedByOutput.has(candidate.outputKey), FailureCode.RECEIPT_TAMPERED, "Receipt selects multiple candidates for one output.", { outputKey: candidate.outputKey });
      invariant(candidate.rejectionCodes.length === 0, FailureCode.RECEIPT_TAMPERED, "Receipt selects a rejected candidate.", { candidateId: candidate.candidateId });
      selectedByOutput.set(candidate.outputKey, candidate);
    }
  }
  for (const [key, output] of outputs) {
    const selected = selectedByOutput.get(key);
    invariant(selected && selected.candidateId === output.candidateId, FailureCode.RECEIPT_TAMPERED, "Receipt output does not match exactly one selected candidate.", { outputKey: key });
    invariant((selected.source === "literal") === (output.conformance === "literal"), FailureCode.RECEIPT_TAMPERED, "Receipt literal source and conformance disagree.", { outputKey: key });
  }

  invariant(Array.isArray(value.decisions) && value.decisions.length > 0 && value.decisions.length <= Limits.maxReceiptDecisions, FailureCode.RECEIPT_TAMPERED, "Receipt rule decisions are invalid.");
  const decisions = new Set();
  const decisionCountByCandidate = new Map();
  const advisoryByCandidate = new Set();
  for (const decision of value.decisions) {
    exactReceiptObject(decision, decisionReceiptFields, "Receipt rule decision");
    const candidateTuple = `${decision.outputKey}\u0000${decision.candidateId}`;
    invariant(candidates.has(candidateTuple) && profileIds.has(decision.profileId), FailureCode.RECEIPT_TAMPERED, "Receipt rule decision references unknown evidence.", { outputKey: decision.outputKey, candidateId: decision.candidateId, profileId: decision.profileId });
    invariant(receiptIdentifierPattern.test(decision.ruleId) && receiptIdentifierPattern.test(decision.reason), FailureCode.RECEIPT_TAMPERED, "Receipt rule decision identifiers are invalid.");
    invariant(["applied", "suppressed", "inapplicable"].includes(decision.disposition), FailureCode.RECEIPT_TAMPERED, "Receipt rule disposition is invalid.");
    invariant([null, "pass", "warn", "fail", "unknown", "not-applicable"].includes(decision.findingStatus), FailureCode.RECEIPT_TAMPERED, "Receipt finding status is invalid.");
    invariant(decision.findingCode === null || (typeof decision.findingCode === "string" && receiptIdentifierPattern.test(decision.findingCode)), FailureCode.RECEIPT_TAMPERED, "Receipt finding code is invalid.");
    invariant((decision.disposition === "applied") === (decision.findingStatus !== null && decision.findingCode !== null), FailureCode.RECEIPT_TAMPERED, "Receipt finding does not match its rule disposition.");
    const tuple = `${candidateTuple}\u0000${decision.profileId}\u0000${decision.ruleId}`;
    invariant(!decisions.has(tuple), FailureCode.RECEIPT_TAMPERED, "Receipt contains duplicate rule decisions.");
    decisions.add(tuple);
    decisionCountByCandidate.set(candidateTuple, (decisionCountByCandidate.get(candidateTuple) ?? 0) + 1);
    if (["warn", "unknown"].includes(decision.findingStatus)) advisoryByCandidate.add(candidateTuple);
    if (candidates.get(candidateTuple).selected) invariant(decision.findingStatus !== "fail", FailureCode.RECEIPT_TAMPERED, "Receipt attaches a failing rule decision to a selected candidate.");
  }
  for (const [tuple, candidate] of candidates) {
    invariant((decisionCountByCandidate.get(tuple) ?? 0) > 0, FailureCode.RECEIPT_TAMPERED, "Receipt omits rule decisions for a candidate.", { candidateId: candidate.candidateId });
    if (!candidate.selected || candidate.source === "literal") continue;
    const output = outputs.get(candidate.outputKey);
    invariant((output.conformance === "degraded") === advisoryByCandidate.has(tuple), FailureCode.RECEIPT_TAMPERED, "Receipt conformance does not match selected advisory findings.", { outputKey: candidate.outputKey });
  }

  exactReceiptObject(value.assurance, ["deterministic", "networkIndependent", "semanticScope", "externallyAnchored"], "Receipt assurance");
  invariant(value.assurance.deterministic === true
    && value.assurance.networkIndependent === true
    && value.assurance.semanticScope === "declared-contract-and-registered-claims"
    && value.assurance.externallyAnchored === false, FailureCode.RECEIPT_TAMPERED, "Receipt contains unsupported assurance claims.");
}

export function verifyReceipt(receipt) {
  const value = copyPlain(receipt, "receipt");
  verifyReceiptStructure(value);
  invariant(value.schemaVersion === EVIDENCE_SCHEMA_VERSION, FailureCode.RECEIPT_TAMPERED, "Receipt schema version is unsupported.");
  invariant(value.trustScope === "reproducibility-and-conformance-only", FailureCode.RECEIPT_TAMPERED, "Receipt overstates its trust scope.");
  const observed = value.derivationDigest;
  delete value.derivationDigest;
  const expected = digest(value);
  invariant(typeof observed === "string" && observed === expected, FailureCode.RECEIPT_TAMPERED, "Receipt integrity verification failed.", { expected, observed });
  return { valid: true, integrity: "self-consistent", authenticated: false, derivationDigest: observed };
}

export function verifyResult(result) {
  assertPlainData(result, "result");
  exactReceiptObject(result, ["engine", "requestId", "conformance", "outputs", "receipt"], "Realization result");
  exactReceiptObject(result.engine, ["name", "version"], "Result engine");
  invariant(["full", "degraded", "literal"].includes(result.conformance), FailureCode.RECEIPT_TAMPERED, "Result conformance is invalid.");
  verifyReceipt(result.receipt);
  invariant(result.engine?.name === result.receipt.engine.name && result.engine?.version === result.receipt.engine.version, FailureCode.RECEIPT_TAMPERED, "Result engine identity does not match its receipt.");
  invariant(result.requestId === result.receipt.requestId, FailureCode.RECEIPT_TAMPERED, "Result request ID does not match its receipt.");
  invariant(Array.isArray(result.outputs) && result.outputs.length === result.receipt.outputs.length, FailureCode.RECEIPT_TAMPERED, "Result output count does not match its receipt.");
  const receipts = new Map(result.receipt.outputs.map((entry) => [entry.key, entry]));
  invariant(receipts.size === result.receipt.outputs.length, FailureCode.RECEIPT_TAMPERED, "Receipt contains duplicate output keys.");
  const observedKeys = new Set();
  for (const output of result.outputs) {
    exactReceiptObject(output, ["key", "layer", "representation", "text", "atomIds", "candidateId", "source", "conformance", "coverage", "findings", "ruleDecisions"], "Realized output");
    invariant(output.key === `${output.layer}:${output.representation}` && receiptOutputKeys.has(output.key), FailureCode.RECEIPT_TAMPERED, "Realized output key does not match its layer and representation.");
    invariant(typeof output.text === "string" && receiptIdentifierPattern.test(output.candidateId), FailureCode.RECEIPT_TAMPERED, "Realized output content identifiers are invalid.");
    exactReceiptObject(output.source, ["kind"], "Realized output source");
    invariant(["provided", "literal"].includes(output.source.kind), FailureCode.RECEIPT_TAMPERED, "Realized output source is invalid.");
    exactReceiptObject(output.coverage, ["requiredIds", "coveredIds", "uncoveredIds", "mappedUncoveredIds", "ratio"], "Realized output coverage");
    for (const field of ["atomIds", "requiredIds", "coveredIds", "uncoveredIds", "mappedUncoveredIds"]) {
      const values = field === "atomIds" ? output.atomIds : output.coverage[field];
      invariant(Array.isArray(values) && values.every((id) => typeof id === "string" && receiptIdentifierPattern.test(id)) && unique(values).length === values.length, FailureCode.RECEIPT_TAMPERED, `Realized output ${field} is invalid.`);
    }
    invariant(typeof output.coverage.ratio === "number" && Number.isFinite(output.coverage.ratio) && output.coverage.ratio >= 0 && output.coverage.ratio <= 1, FailureCode.RECEIPT_TAMPERED, "Realized output coverage ratio is invalid.");
    invariant(Array.isArray(output.findings), FailureCode.RECEIPT_TAMPERED, "Realized output findings are invalid.");
    for (const finding of output.findings) {
      exactReceiptObject(finding, ["ruleId", "status", "code", "message", "data"], "Realized output finding");
      invariant(receiptIdentifierPattern.test(finding.ruleId) && receiptIdentifierPattern.test(finding.code) && typeof finding.message === "string" && ["pass", "warn", "fail", "unknown", "not-applicable"].includes(finding.status), FailureCode.RECEIPT_TAMPERED, "Realized output finding is invalid.");
    }
    invariant(Array.isArray(output.ruleDecisions), FailureCode.RECEIPT_TAMPERED, "Realized output rule decisions are invalid.");
    for (const decision of output.ruleDecisions) {
      exactReceiptObject(decision, decisionReceiptFields, "Realized output rule decision");
      invariant(decision.outputKey === output.key && decision.candidateId === output.candidateId, FailureCode.RECEIPT_TAMPERED, "Realized output contains a decision for different evidence.");
    }
    const record = receipts.get(output.key);
    invariant(!observedKeys.has(output.key), FailureCode.RECEIPT_TAMPERED, "Result contains duplicate output keys.", { outputKey: output.key });
    observedKeys.add(output.key);
    invariant(record
      && record.candidateId === output.candidateId
      && record.conformance === output.conformance
      && record.digest === digest(output), FailureCode.RECEIPT_TAMPERED, "An output does not match its receipt.", { outputKey: output.key });
  }
  const expectedConformance = result.outputs.reduce((lowest, output) => CONFORMANCE_ORDER[output.conformance] < CONFORMANCE_ORDER[lowest] ? output.conformance : lowest, "full");
  invariant(result.conformance === expectedConformance, FailureCode.RECEIPT_TAMPERED, "Result conformance does not equal the minimum bound output conformance.", { expected: expectedConformance, observed: result.conformance });
  return { valid: true, integrity: "self-consistent", authenticated: false, derivationDigest: result.receipt.derivationDigest };
}

export function createEngine(options = {}) {
  const profiles = compileProfiles(options.profiles ?? [relationalSystemsDefinition]);
  const engine = {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    profiles: profiles.map((profile) => ({ id: profile.id, version: profile.version, title: profile.title, digest: profile.digest })),
    realize(sourceRequest) {
      const request = copyPlain(sourceRequest, "request");
      assertIdentifier(request.id, "Request ID");
      const contract = validateContract(request.contract);
      const context = validateContext(request.context);
      if (context.stakes === "safety-critical" || context.safetyClass === "critical") {
        invariant(/^en(?:-[A-Za-z0-9]+)*$/u.test(context.locale), FailureCode.UNSUPPORTED_CONTEXT, "Critical processing is available only for explicitly English locale contexts in this release.", { locale: context.locale });
      }
      const outputs = normalizeOutputs(request.outputs, context);
      if (context.stakes === "safety-critical" || context.safetyClass === "critical") {
        const unsafeAtoms = requiredAtomsFor(contract, { layer: "operative", representation: "standard" })
          .filter((atom) => !atom.literalForm || atom.delivery.operative !== "explicit")
          .map((atom) => atom.id);
        invariant(!unsafeAtoms.length, FailureCode.CONTRACT_INCOMPLETE, "Every atom required in critical operative output must have an explicit controlled literal form.", { atomIds: unsafeAtoms });
      }
      const activeProfiles = selectProfiles(profiles, request.profileIds);
      const candidates = validateCandidates(request.candidates, outputs, context);
      const selected = [];
      const evaluationsByOutput = [];
      for (const output of outputs) {
        const key = outputKey(output);
        const supplied = candidates.filter((candidate) => outputKey(candidate) === key);
        const pool = supplied.length ? supplied : [literalCandidate(contract, output)];
        const evaluations = pool.map((candidate) => evaluateCandidate(candidate, contract, context, output, activeProfiles));
        const chosen = chooseCandidate(evaluations, key, supplied.length > 0);
        selected.push({ output, evaluation: chosen });
        evaluationsByOutput.push({ key, evaluations, selected: chosen });
      }
      ensureAccessibilityParity(selected, contract);
      const publicOutputs = selected.map(({ output, evaluation }) => {
        const conformance = resultConformance(evaluation);
        return {
          key: outputKey(output),
          layer: output.layer,
          representation: output.representation,
          text: evaluation.candidate.text,
          atomIds: evaluation.candidate.atomIds,
          candidateId: evaluation.candidate.id,
          source: evaluation.candidate.source,
          conformance,
          coverage: evaluation.coverage,
          findings: [...evaluation.hardFindings.map(publicFinding), ...evaluation.ruleDecisions.filter((decision) => decision.finding).map((decision) => publicFinding(decision.finding))],
          ruleDecisions: evaluation.ruleDecisions.map((decision) => publicDecision(outputKey(output), decision, evaluation.candidate.id))
        };
      });
      const conformance = publicOutputs.reduce((lowest, output) => CONFORMANCE_ORDER[output.conformance] < CONFORMANCE_ORDER[lowest] ? output.conformance : lowest, "full");
      const normalizedRequest = { ...request, contract, context, outputs, profileIds: activeProfiles.map((profile) => profile.id), candidates };
      const inputDigest = digest(normalizedRequest);
      const receipt = makeReceipt(request.id, inputDigest, activeProfiles, publicOutputs, evaluationsByOutput);
      return deepFreeze({
        engine: { name: ENGINE_NAME, version: ENGINE_VERSION },
        requestId: request.id,
        conformance,
        outputs: publicOutputs,
        receipt
      });
    },
    lint(source) {
      const request = copyPlain(source, "lint request");
      const context = validateContext(request.context);
      const output = request.output ?? { layer: "experiential", representation: "standard" };
      outputKey(output);
      const activeProfiles = selectProfiles(profiles, request.profileIds);
      const candidate = {
        id: "lint-candidate",
        layer: output.layer,
        representation: output.representation,
        text: normalizeText(request.text, "Lint text").trim(),
        atomIds: [],
        metadata: validateMetadata(request.metadata, "lint-candidate"),
        source: { kind: "provided" }
      };
      invariant(candidate.text.length > 0, FailureCode.INVALID_INPUT, "Lint text cannot be empty.");
      const environment = { ...context, layer: output.layer, representation: output.representation, context, output };
      const decisions = [];
      for (const profile of activeProfiles) {
        for (const resolution of resolveRules(profile, environment, protectedTags(context, output))) {
          const finding = resolution.disposition === "applied" ? runRuleValidator(candidate, resolution.rule, environment) : null;
          decisions.push({ profileId: profile.id, ...resolution, finding });
        }
      }
      return deepFreeze({
        advisoryOnly: true,
        semanticGuarantee: false,
        findings: decisions.filter((decision) => decision.finding).map((decision) => publicFinding(decision.finding)),
        ruleDecisions: decisions.map((decision) => publicDecision(outputKey(output), decision, candidate.id))
      });
    }
  };
  return deepFreeze(engine);
}

export function lintText(source, options = {}) {
  return createEngine(options).lint(source);
}

export { ENGINE_NAME, Priority };
