import { FailureCode } from "./errors.js";
import { atomCoverage, literalize, requiredAtomsFor } from "./semantic.js";
import { contentTokens, jaccard, normalizeComparable, normalizeText, splitSentences, standardDeviation, tokenize, unique } from "./util.js";

export const KnownValidators = Object.freeze(new Set([
  "subtext-redundancy",
  "exposition-state-change",
  "dialogue-objective",
  "sentence-variance",
  "punctuation-restraint",
  "technical-claims",
  "externality-presence",
  "scene-ending",
  "focal-specificity",
  "embodied-anchor",
  "layered-depth",
  "action-clarity",
  "manual-review"
]));

function finding(ruleId, status, code, message, data = {}) {
  return { ruleId, status, code, message, data };
}

function redundantInference(candidate, rule) {
  const sentences = splitSentences(candidate.text);
  const threshold = Number(rule.params.threshold ?? 0.76);
  const repetitions = [];
  for (let left = 0; left < sentences.length; left += 1) {
    for (let right = left + 1; right < Math.min(sentences.length, left + 4); right += 1) {
      const similarity = jaccard(sentences[left], sentences[right]);
      if (similarity >= threshold) repetitions.push({ left, right, similarity });
    }
  }
  return repetitions.length
    ? finding(rule.id, "warn", "W_REDUNDANT_INFERENCE", "Nearby sentences appear to restate the same proposition without registered novelty.", { repetitions })
    : finding(rule.id, "pass", "P_NO_REDUNDANT_INFERENCE", "No high-overlap nearby inference was detected.");
}

function expositionStateChange(candidate, rule) {
  const minimumWords = Number(rule.params.minimumWords ?? 60);
  const words = tokenize(candidate.text).length;
  const deltas = unique(candidate.metadata?.stateChanges ?? []);
  if (words >= minimumWords && deltas.length === 0) {
    return finding(rule.id, "warn", "W_EXPOSITION_NO_DELTA", "A substantial passage has no registered state change or deferred payoff.", { words });
  }
  return finding(rule.id, "pass", "P_EXPOSITION_LINKED", "Exposition is short or linked to a state change.", { words, deltas });
}

function dialogueObjective(candidate, rule, environment) {
  if (!["dialogue", "conversation"].includes(environment.context.surface) && environment.context.mode !== "conversation") {
    return finding(rule.id, "not-applicable", "N_NOT_DIALOGUE", "The candidate is not dialogue.");
  }
  const objectives = candidate.metadata?.speakerObjectives ?? {};
  const speakers = unique(candidate.metadata?.speakers ?? []);
  const missing = speakers.filter((speaker) => !objectives[speaker]);
  if (!speakers.length || missing.length) return finding(rule.id, "warn", "W_DIALOGUE_OBJECTIVE_MISSING", "Dialogue lacks explicit speaker-objective evidence.", { missing });
  return finding(rule.id, "pass", "P_DIALOGUE_OBJECTIVES", "Each registered speaker has an immediate objective.");
}

function sentenceVariance(candidate, rule) {
  const lengths = splitSentences(candidate.text).map((sentence) => tokenize(sentence).length).filter(Boolean);
  if (lengths.length < 3) return finding(rule.id, "not-applicable", "N_SHORT_SAMPLE", "The sample is too short for cadence evaluation.");
  const deviation = standardDeviation(lengths);
  const minimum = Number(rule.params.minimumStandardDeviation ?? 3);
  const maximum = Number(rule.params.maximumStandardDeviation ?? 18);
  if (deviation < minimum || deviation > maximum) return finding(rule.id, "warn", "W_CADENCE_RANGE", "Sentence variance falls outside the contextual preference range.", { deviation, minimum, maximum });
  return finding(rule.id, "pass", "P_CADENCE_RANGE", "Sentence variance falls within the contextual preference range.", { deviation });
}

function punctuationRestraint(candidate, rule) {
  const words = Math.max(1, tokenize(candidate.text).length);
  const rates = {
    emDash: 1000 * (candidate.text.match(/—/gu)?.length ?? 0) / words,
    parenthesis: 1000 * (candidate.text.match(/\(/gu)?.length ?? 0) / words,
    semicolon: 1000 * (candidate.text.match(/;/gu)?.length ?? 0) / words
  };
  const limits = {
    emDash: Number(rule.params.maxEmDashesPer1000 ?? 12),
    parenthesis: Number(rule.params.maxParenthesesPer1000 ?? 6),
    semicolon: Number(rule.params.maxSemicolonsPer1000 ?? 7)
  };
  const exceeded = Object.keys(rates).filter((key) => rates[key] > limits[key]);
  return exceeded.length
    ? finding(rule.id, "warn", "W_PUNCTUATION_EXCESS", "Punctuation intensity exceeds the preferred contextual range.", { rates, limits, exceeded })
    : finding(rule.id, "pass", "P_PUNCTUATION_RESTRAINED", "Punctuation remains within the preferred contextual range.", { rates });
}

function technicalClaims(candidate, rule) {
  const claims = candidate.metadata?.claims ?? [];
  const allowed = new Set(["qualified", "fictional", "uncertain"]);
  const invalid = claims.filter((claim) => !allowed.has(claim.status)
    || !Array.isArray(claim.atomIds)
    || claim.atomIds.length === 0);
  return invalid.length
    ? finding(rule.id, "fail", FailureCode.INVENTED_SEMANTICS, "A technical or factual claim lacks an allowed non-verified status and semantic provenance. This engine has no external attestation registry and cannot certify verified status.", { invalidClaimIds: invalid.map((claim) => claim.id) })
    : finding(rule.id, "pass", "P_CLAIMS_SCOPED", "Registered claims carry an allowed non-verified status and semantic provenance.");
}

function externalityPresence(candidate, rule, environment) {
  if (!["consequential", "urgent", "safety-critical"].includes(environment.context.stakes)) return finding(rule.id, "not-applicable", "N_LOW_STAKES", "Externality evidence is not required at ambient stakes.");
  const parties = unique(candidate.metadata?.affectedParties ?? []);
  return parties.length
    ? finding(rule.id, "pass", "P_EXTERNALITIES_PRESENT", "Affected parties are represented.", { parties })
    : finding(rule.id, "warn", "W_EXTERNALITIES_MISSING", "Consequential copy does not identify affected parties.");
}

function sceneEnding(candidate, rule) {
  const sentences = splitSentences(candidate.text);
  if (sentences.length < 2) return finding(rule.id, "not-applicable", "N_SINGLE_SENTENCE", "No ending pair is available for comparison.");
  const similarity = jaccard(sentences.at(-2), sentences.at(-1));
  const threshold = Number(rule.params.threshold ?? 0.7);
  return similarity >= threshold
    ? finding(rule.id, "warn", "W_POST_CLOSURE_RESTATEMENT", "The final sentence appears to restate the preceding closure.", { similarity })
    : finding(rule.id, "pass", "P_ENDING_ADVANCES", "The ending does not closely duplicate the preceding sentence.", { similarity });
}

function focalSpecificity(candidate, rule, environment) {
  const expected = environment.context.focalizer?.id;
  if (!expected) return finding(rule.id, "not-applicable", "N_NO_FOCALIZER", "No focalizer was provided.");
  const observed = candidate.metadata?.focalizerId;
  return observed === expected
    ? finding(rule.id, "pass", "P_FOCALIZER_MATCH", "Candidate focalization matches the context.")
    : finding(rule.id, "warn", "W_FOCALIZER_UNPROVEN", "Candidate does not carry matching focalizer evidence.", { expected, observed });
}

function embodiedAnchor(candidate, rule, environment) {
  if (environment.output.layer !== "experiential") return finding(rule.id, "not-applicable", "N_NOT_EXPERIENTIAL", "Embodied anchoring is evaluated in experiential output.");
  const anchors = unique(candidate.metadata?.sensoryAnchors ?? []);
  return anchors.length
    ? finding(rule.id, "pass", "P_EMBODIED_ANCHOR", "Experiential copy has a registered material or embodied anchor.", { anchors })
    : finding(rule.id, "warn", "W_EMBODIED_ANCHOR_MISSING", "Experiential copy lacks a registered material or embodied anchor.");
}

function layeredDepth(candidate, rule, environment) {
  if (!environment.context.sceneImportance || environment.context.sceneImportance !== "major") return finding(rule.id, "not-applicable", "N_NOT_MAJOR_SCENE", "Maximum-depth evidence is required for major scenes.");
  const layers = unique(candidate.metadata?.narrativeLayers ?? []);
  const links = candidate.metadata?.causalLinks ?? [];
  const minimumLayers = Number(rule.params.minimumLayers ?? 3);
  const minimumLinks = Number(rule.params.minimumCausalLinks ?? 2);
  return layers.length >= minimumLayers && links.length >= minimumLinks
    ? finding(rule.id, "pass", "P_CAUSAL_DEPTH", "Major-scene layers have registered causal links.", { layers, linkCount: links.length })
    : finding(rule.id, "warn", "W_CAUSAL_DEPTH_UNPROVEN", "Major-scene depth lacks enough registered layers or causal links.", { layers, linkCount: links.length, minimumLayers, minimumLinks });
}

function actionClarity(candidate, rule, environment) {
  if (!new Set(["movement", "action", "care"]).has(environment.context.mode)) return finding(rule.id, "not-applicable", "N_NOT_ACTION", "Action clarity is not triggered by this mode.");
  const mappedActions = (environment.contract?.atoms ?? []).filter((atom) => candidate.atomIds?.includes(atom.id) && atom.kind === "action");
  const derived = mappedActions.length ? {
    actor: mappedActions[0].frame.subject,
    action: mappedActions[0].frame.predicate,
    result: mappedActions[0].frame.object ?? mappedActions[0].literalForm
  } : null;
  const graph = candidate.metadata?.actionGraph ?? derived;
  const required = ["actor", "action", "result"];
  const missing = required.filter((field) => !graph?.[field]);
  return missing.length
    ? finding(rule.id, "warn", "W_ACTION_GRAPH_INCOMPLETE", "Action evidence lacks actor, action, or result.", { missing })
    : finding(rule.id, "pass", "P_ACTION_GRAPH", "Action evidence identifies actor, action, and result.");
}

const implementations = Object.freeze({
  "subtext-redundancy": redundantInference,
  "exposition-state-change": expositionStateChange,
  "dialogue-objective": dialogueObjective,
  "sentence-variance": sentenceVariance,
  "punctuation-restraint": punctuationRestraint,
  "technical-claims": technicalClaims,
  "externality-presence": externalityPresence,
  "scene-ending": sceneEnding,
  "focal-specificity": focalSpecificity,
  "embodied-anchor": embodiedAnchor,
  "layered-depth": layeredDepth,
  "action-clarity": actionClarity,
  "manual-review": (candidate, rule) => finding(rule.id, "unknown", "M_MANUAL_REVIEW", "This rule requires semantic or human review.")
});

export function runRuleValidator(candidate, rule, environment) {
  const result = implementations[rule.validatorId](candidate, rule, environment);
  if (rule.enforcement === "hard" && result.status !== "pass" && result.status !== "fail") {
    const code = result.status === "warn" ? `E_${result.code.replace(/^W_/u, "")}` : FailureCode.UNSUPPORTED_CONTEXT;
    return { ...result, status: "fail", code };
  }
  return result;
}

function lexicalAccessibilityDependencies(text) {
  const comparable = normalizeComparable(text);
  const cues = {
    color: ["when it turns red", "when it turns green", "the red item", "the green item", "color shown"],
    sound: ["after the chime", "when you hear", "as it sounds", "bell rings", "bell ring", "after the bell", "beep", "audio tone", "alarm sounds"],
    imagery: ["as pictured", "as shown", "mirror the pose", "looks like"],
    "spatial-inference": ["over there", "the one above", "the one below"]
  };
  return Object.entries(cues).filter(([, phrases]) => phrases.some((phrase) => comparable.includes(phrase))).map(([kind]) => kind);
}

export function runHardGates(candidate, environment) {
  const findings = [];
  const { contract, coverage, output, context } = environment;
  const plain = normalizeText(candidate.text, "Candidate text");
  if (plain.length > (context.limits?.maxCharacters ?? 50_000)) findings.push(finding("LRE-BND-001", "fail", FailureCode.EXECUTION_BOUND, "Candidate exceeds the output character bound."));
  if (/<\/?[A-Za-z][^>]*>/u.test(plain)) findings.push(finding("LRE-OUT-001", "fail", FailureCode.INVALID_INPUT, "Output must be structured plain text, not executable or presentation markup."));
  if (coverage.uncoveredIds.length) findings.push(finding("LRE-SEM-001", "fail", FailureCode.UNCOVERED_ATOM, "Candidate does not cover every required semantic atom.", { atomIds: coverage.uncoveredIds }));
  else findings.push(finding("LRE-SEM-001", "pass", "P_SEMANTIC_COVERAGE", "Every required semantic atom is covered.", { atomIds: coverage.coveredIds }));
  if (coverage.mappedUncoveredIds.length) findings.push(finding("LRE-SEM-004", "fail", FailureCode.SEMANTIC_DRIFT, "Candidate claims semantic atom mappings that its text does not support.", { atomIds: coverage.mappedUncoveredIds }));

  const mappedForLicensing = contract.atoms.filter((atom) => candidate.atomIds?.includes(atom.id));
  const claimMappedIds = new Set((candidate.metadata?.claims ?? []).flatMap((claim) => claim.atomIds ?? []));
  const unlicensedSentences = splitSentences(plain).filter((sentence) => !mappedForLicensing.some((atom) => {
    if (atomCoverage(atom, sentence)) return true;
    const anchors = contentTokens([atom.literalForm, atom.frame.subject, atom.frame.predicate, atom.frame.object, ...(atom.match?.allOf ?? []), ...(atom.match?.anyOf ?? [])].filter(Boolean).join(" "));
    const observed = contentTokens(sentence);
    const overlap = [...anchors].filter((token) => observed.has(token)).length;
    return overlap >= Math.min(2, anchors.size);
  }) && !mappedForLicensing.some((atom) => claimMappedIds.has(atom.id)));
  if (unlicensedSentences.length) findings.push(finding("LRE-AUT-003", "fail", FailureCode.INVENTED_SEMANTICS, "Candidate contains sentences that are not licensed by mapped atoms or registered claims.", { sentences: unlicensedSentences }));

  const prohibited = contract.prohibitedClaims.filter((claim) => normalizeComparable(plain).includes(normalizeComparable(claim.literalForm)));
  if (prohibited.length) findings.push(finding("LRE-SEM-002", "fail", FailureCode.LAYER_CONTRADICTION, "Candidate contains a prohibited claim.", { claimIds: prohibited.map((claim) => claim.id ?? claim.literalForm) }));

  const dependencies = unique([...(candidate.metadata?.dependencies ?? []), ...lexicalAccessibilityDependencies(plain)]);
  const mappedAtoms = contract.atoms.filter((atom) => candidate.atomIds?.includes(atom.id));
  const prohibitedByAtom = unique(mappedAtoms.flatMap((atom) => atom.prohibitedDependencies.filter((dependency) => dependencies.includes(dependency))));
  if (prohibitedByAtom.length) findings.push(finding("LRE-DEP-001", "fail", FailureCode.SEMANTIC_DRIFT, "Candidate uses a delivery dependency prohibited by one or more mapped atoms.", { dependencies: prohibitedByAtom }));

  const unavailable = [];
  if (!context.channel.visualAvailable) unavailable.push(...dependencies.filter((dependency) => ["imagery", "color"].includes(dependency)));
  if (!context.channel.audioAvailable) unavailable.push(...dependencies.filter((dependency) => dependency === "sound"));
  if (!context.channel.spatialInferenceAllowed) unavailable.push(...dependencies.filter((dependency) => dependency === "spatial-inference"));
  if (unique(unavailable).length) findings.push(finding("LRE-CHN-001", "fail", FailureCode.ACCESSIBILITY_GAP, "Candidate depends on a channel unavailable in the declared context.", { dependencies: unique(unavailable) }));
  if (output.representation === "accessibility-equivalent") {
    const denied = new Set(["imagery", "color", "sound", "spatial-inference", "implication"]);
    const invalid = dependencies.filter((dependency) => denied.has(dependency));
    if (invalid.length) findings.push(finding("LRE-ACC-001", "fail", FailureCode.ACCESSIBILITY_GAP, "Accessibility-equivalent copy depends on a prohibited channel or inference.", { dependencies: invalid }));
    else findings.push(finding("LRE-ACC-001", "pass", "P_ACCESSIBILITY_INDEPENDENT", "Accessibility-equivalent copy has no registered prohibited dependency."));
  }

  if (output.layer === "operative") {
    const required = requiredAtomsFor(contract, output);
    if (required.length && required.every((atom) => atom.literalForm)) {
      const controlled = literalize(contract, output).trim();
      if (plain !== controlled) findings.push(finding("LRE-OPR-001", "fail", FailureCode.INVENTED_SEMANTICS, "Operative copy with complete controlled forms must match those forms exactly.", { expected: controlled }));
    }
  }

  if (context.stakes === "safety-critical" || context.safetyClass === "critical") {
    const requiredLiteral = contract.atoms.filter((atom) => atom.criticality === "safety" && atom.requiredIn.includes(output.layer));
    const missing = requiredLiteral.filter((atom) => !normalizeComparable(plain).includes(normalizeComparable(atom.literalForm))).map((atom) => atom.id);
    if (missing.length) findings.push(finding("LRE-SAF-001", "fail", FailureCode.CRITICAL_ATOM_NONLITERAL, "Safety atoms must appear in controlled literal form.", { atomIds: missing }));
    const figurative = dependencies.filter((dependency) => ["imagery", "implication"].includes(dependency));
    if (figurative.length && output.layer === "operative") findings.push(finding("LRE-SAF-002", "fail", FailureCode.CRITICAL_ATOM_NONLITERAL, "Operative safety copy cannot depend on figurative delivery."));
    if (output.layer === "operative") {
      const controlled = literalize(contract, output).trim();
      if (plain !== controlled) findings.push(finding("LRE-SAF-003", "fail", FailureCode.INVENTED_SEMANTICS, "Critical operative copy must contain exactly the controlled forms declared by the contract, without appended assertions.", { expected: controlled }));
    }
    if (output.layer !== "operative") {
      const safetyAtoms = contract.atoms.filter((atom) => atom.criticality === "safety"
        && (atom.kind === "prohibition" || atom.frame.polarity === "negative" || atom.frame.modality === "must-not" || /\b(?:do not|never|must not|cannot)\b/iu.test(atom.literalForm)));
      const contradictoryReferences = safetyAtoms.filter((atom) => {
        const core = contentTokens(atom.literalForm);
        return splitSentences(plain).some((sentence) => {
          if (normalizeComparable(sentence).includes(normalizeComparable(atom.literalForm))) return false;
          const observed = contentTokens(sentence);
          return [...core].filter((token) => observed.has(token)).length >= Math.min(2, core.size);
        });
      }).map((atom) => atom.id);
      if (contradictoryReferences.length) findings.push(finding("LRE-SAF-004", "fail", FailureCode.LAYER_CONTRADICTION, "Non-operative copy references a safety atom without preserving its controlled statement.", { atomIds: contradictoryReferences }));
    }
  }

  const claims = candidate.metadata?.claims ?? [];
  const claimFinding = technicalClaims(candidate, { id: "LRE-AUT-001" });
  findings.push(claimFinding);
  const knownAtomIds = new Set(contract.atoms.map((atom) => atom.id));
  const unlicensed = claims.filter((claim) => (claim.atomIds ?? []).some((id) => !knownAtomIds.has(id)));
  if (unlicensed.length) findings.push(finding("LRE-AUT-002", "fail", FailureCode.INVENTED_SEMANTICS, "A claim references semantic atoms outside the contract.", { claimIds: unlicensed.map((claim) => claim.id) }));
  const mappedAtomIds = new Set(candidate.atomIds ?? []);
  const unmappedClaims = claims.filter((claim) => (claim.atomIds ?? []).some((id) => !mappedAtomIds.has(id)));
  if (unmappedClaims.length) findings.push(finding("LRE-AUT-004", "fail", FailureCode.INVENTED_SEMANTICS, "A claim references atoms not mapped to its candidate output.", { claimIds: unmappedClaims.map((claim) => claim.id) }));

  for (const relation of contract.relations.filter((entry) => ["before", "after"].includes(entry.type))) {
    const firstId = relation.type === "after" ? relation.to : relation.from;
    const secondId = relation.type === "after" ? relation.from : relation.to;
    const left = contract.atoms.find((atom) => atom.id === firstId);
    const right = contract.atoms.find((atom) => atom.id === secondId);
    const leftIndex = normalizeComparable(plain).indexOf(normalizeComparable(left.literalForm ?? left.frame.predicate));
    const rightIndex = normalizeComparable(plain).indexOf(normalizeComparable(right.literalForm ?? right.frame.predicate));
    if (leftIndex >= 0 && rightIndex >= 0 && leftIndex > rightIndex) findings.push(finding("LRE-SEM-003", "fail", FailureCode.SEMANTIC_DRIFT, "Candidate reverses a protected semantic order.", { relation }));
  }
  return findings;
}

export function findingPenalty(result) {
  if (result.status === "fail") return 1_000;
  if (result.status === "warn") return 10;
  if (result.status === "unknown") return 4;
  return 0;
}
