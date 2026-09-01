import { Layers, Limits, Representations } from "./constants.js";
import { FailureCode, invariant, LatticeError } from "./errors.js";
import { assertIdentifier, assertVersion, normalizeComparable, normalizeText, splitSentences, tokenize, unique } from "./util.js";

const atomKinds = new Set(["action", "state", "timing", "condition", "constraint", "consequence", "prohibition", "uncertainty", "recovery", "relation"]);
const criticalities = new Set(["safety", "operative", "domain", "contextual"]);
const polarities = new Set(["positive", "negative"]);
const modalities = new Set(["must", "must-not", "may", "will", "might", "is"]);
const deliveries = new Set(["explicit", "inferable", "optional"]);
const protectedFields = new Set(["subject", "predicate", "object", "value", "unit", "polarity", "modality", "conditions"]);
const dependencyKinds = new Set(["imagery", "color", "sound", "direction", "timing-perception", "implication", "spatial-inference"]);
const relationKinds = new Set(["before", "after", "causes", "requires", "contradicts"]);

function validateStringArray(value, allowed, label) {
  invariant(Array.isArray(value), FailureCode.CONTRACT_INCOMPLETE, `${label} must be an array.`);
  const normalized = unique(value);
  invariant(normalized.length === value.length, FailureCode.CONTRACT_INCOMPLETE, `${label} contains duplicates.`);
  for (const entry of value) invariant(allowed.has(entry), FailureCode.CONTRACT_INCOMPLETE, `${label} contains an unsupported value.`, { value: entry });
  return value;
}

function atomSignature(atom) {
  const frame = atom.frame;
  return [frame.subject, frame.predicate, frame.object ?? "", frame.value ?? "", frame.unit ?? ""].map(normalizeComparable).join("|");
}

export function requiresControlledLiteral(atom) {
  return ["safety", "operative"].includes(atom.criticality)
    || ["condition", "timing", "prohibition", "uncertainty", "recovery"].includes(atom.kind)
    || atom.frame.polarity === "negative"
    || ["must", "must-not", "might"].includes(atom.frame.modality)
    || atom.frame.value !== undefined
    || atom.frame.unit !== undefined;
}

function validateFrame(frame, atomId) {
  invariant(frame && typeof frame === "object" && !Array.isArray(frame), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atomId} requires a frame.`);
  for (const field of ["subject", "predicate"]) {
    invariant(typeof frame[field] === "string" && frame[field].trim(), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atomId} requires frame.${field}.`);
    frame[field] = normalizeText(frame[field], `Atom ${atomId} frame.${field}`).trim();
  }
  for (const field of ["object", "unit"]) {
    if (frame[field] !== undefined) frame[field] = normalizeText(frame[field], `Atom ${atomId} frame.${field}`).trim();
  }
  if (frame.value !== undefined) {
    invariant(typeof frame.value === "string" || Number.isFinite(frame.value), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atomId} frame.value must be finite text or a number.`);
  }
  invariant(polarities.has(frame.polarity), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atomId} has invalid polarity.`);
  invariant(modalities.has(frame.modality), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atomId} has invalid modality.`);
  if (frame.conditionIds !== undefined) {
    invariant(Array.isArray(frame.conditionIds), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atomId} conditionIds must be an array.`);
    frame.conditionIds.forEach((id) => assertIdentifier(id, `Atom ${atomId} condition ID`));
  }
}

export function validateContract(source) {
  invariant(source && typeof source === "object" && !Array.isArray(source), FailureCode.CONTRACT_INCOMPLETE, "A meaning contract is required.");
  assertIdentifier(source.id, "Contract ID");
  assertVersion(source.revision, "Contract revision");
  invariant(Array.isArray(source.atoms) && source.atoms.length > 0, FailureCode.CONTRACT_INCOMPLETE, "The contract requires at least one semantic atom.");
  invariant(source.atoms.length <= Limits.maxAtoms, FailureCode.EXECUTION_BOUND, "The contract contains too many atoms.");

  const ids = new Set();
  const signatures = new Map();
  for (const atom of source.atoms) {
    invariant(atom && typeof atom === "object" && !Array.isArray(atom), FailureCode.CONTRACT_INCOMPLETE, "Each semantic atom must be an object.");
    assertIdentifier(atom.id, "Atom ID");
    invariant(!ids.has(atom.id), FailureCode.CONTRACT_INCOMPLETE, "Semantic atom IDs must be unique.", { atomId: atom.id });
    ids.add(atom.id);
    invariant(atomKinds.has(atom.kind), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} has an unsupported kind.`);
    invariant(criticalities.has(atom.criticality), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} has unsupported criticality.`);
    validateFrame(atom.frame, atom.id);
    validateStringArray(atom.requiredIn ?? [], new Set(Layers), `Atom ${atom.id} requiredIn`);
    atom.requiredIn = atom.requiredIn ?? [];
    atom.delivery = atom.delivery ?? {};
    for (const [layer, delivery] of Object.entries(atom.delivery)) {
      invariant(Layers.includes(layer), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} has an unsupported delivery layer.`);
      invariant(deliveries.has(delivery), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} has an unsupported delivery mode.`);
    }
    atom.protectedFields = atom.protectedFields ?? [];
    validateStringArray(atom.protectedFields, protectedFields, `Atom ${atom.id} protectedFields`);
    atom.prohibitedDependencies = atom.prohibitedDependencies ?? [];
    validateStringArray(atom.prohibitedDependencies, dependencyKinds, `Atom ${atom.id} prohibitedDependencies`);
    if (atom.literalForm !== undefined) atom.literalForm = normalizeText(atom.literalForm, `Atom ${atom.id} literalForm`).trim();
    if (requiresControlledLiteral(atom)) {
      invariant(atom.literalForm, FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} requires a controlled literal form.`);
    }
    if (["safety", "operative"].includes(atom.criticality)) {
      invariant(atom.requiredIn.includes("operative"), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} must be required in the operative layer.`);
    }
    if (atom.criticality === "safety") {
      invariant(atom.delivery.operative === "explicit", FailureCode.CONTRACT_INCOMPLETE, `Safety atom ${atom.id} must use explicit operative delivery.`);
    }
    if (atom.match !== undefined) {
      invariant(atom.match && typeof atom.match === "object" && !Array.isArray(atom.match), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} match must be an object.`);
      for (const field of ["allOf", "anyOf", "noneOf"]) {
        if (atom.match[field] === undefined) continue;
        invariant(Array.isArray(atom.match[field]), FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} match.${field} must be an array.`);
        atom.match[field] = atom.match[field].map((value) => normalizeText(value, `Atom ${atom.id} match.${field}`).trim());
      }
    }
    const hasPositiveMatch = (atom.match?.allOf?.length ?? 0) > 0 || (atom.match?.anyOf?.length ?? 0) > 0;
    invariant(atom.literalForm || hasPositiveMatch, FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} requires either a controlled literal form or positive match evidence.`);

    const signature = atomSignature(atom);
    const earlier = signatures.get(signature);
    if (earlier && (earlier.frame.polarity !== atom.frame.polarity || earlier.frame.modality !== atom.frame.modality)) {
      throw new LatticeError(FailureCode.CONTRADICTORY_ATOMS, "The contract contains contradictory atoms.", { atomIds: [earlier.id, atom.id] });
    }
    signatures.set(signature, atom);
  }

  for (const atom of source.atoms) {
    const unresolved = (atom.frame.conditionIds ?? []).filter((id) => !ids.has(id));
    invariant(!unresolved.length, FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} references unresolved condition atoms.`, { atomId: atom.id, conditionIds: unresolved });
    for (const conditionId of atom.frame.conditionIds ?? []) {
      const condition = source.atoms.find((entry) => entry.id === conditionId);
      const missingLayers = atom.requiredIn.filter((layer) => !condition.requiredIn.includes(layer) || condition.delivery?.[layer] === "optional");
      invariant(!missingLayers.length, FailureCode.CONTRACT_INCOMPLETE, `Atom ${atom.id} depends on a condition that is not required in every dependent layer.`, { atomId: atom.id, conditionId, layers: missingLayers });
    }
  }

  source.relations = source.relations ?? [];
  invariant(Array.isArray(source.relations) && source.relations.length <= Limits.maxRelations, FailureCode.EXECUTION_BOUND, "The contract contains too many relations.");
  for (const relation of source.relations) {
    invariant(ids.has(relation.from) && ids.has(relation.to), FailureCode.CONTRACT_INCOMPLETE, "Every relation must reference existing atoms.");
    invariant(relationKinds.has(relation.type), FailureCode.CONTRACT_INCOMPLETE, "The contract contains an unsupported relation type.");
    invariant(relation.from !== relation.to, FailureCode.CONTRACT_INCOMPLETE, "An atom cannot relate to itself.");
    if (relation.type === "requires") {
      const dependent = source.atoms.find((atom) => atom.id === relation.from);
      const dependency = source.atoms.find((atom) => atom.id === relation.to);
      const missingLayers = dependent.requiredIn.filter((layer) => !dependency.requiredIn.includes(layer) || dependency.delivery?.[layer] === "optional");
      invariant(!missingLayers.length, FailureCode.CONTRACT_INCOMPLETE, "A required semantic dependency must be present in every dependent layer.", { relation, layers: missingLayers });
    }
  }
  detectOrderingCycle(source.relations);

  source.prohibitedClaims = source.prohibitedClaims ?? [];
  invariant(Array.isArray(source.prohibitedClaims), FailureCode.CONTRACT_INCOMPLETE, "prohibitedClaims must be an array.");
  for (const claim of source.prohibitedClaims) {
    invariant(typeof claim.literalForm === "string" && claim.literalForm.trim(), FailureCode.CONTRACT_INCOMPLETE, "Each prohibited claim requires literalForm.");
    claim.literalForm = normalizeText(claim.literalForm, "Prohibited claim literalForm").trim();
  }
  source.terminology = source.terminology ?? {};
  invariant(source.terminology && typeof source.terminology === "object" && !Array.isArray(source.terminology), FailureCode.CONTRACT_INCOMPLETE, "terminology must be an object.");
  for (const [term, definition] of Object.entries(source.terminology)) {
    invariant(term.trim() && typeof definition === "string" && definition.trim(), FailureCode.CONTRACT_INCOMPLETE, "Terminology entries require a term and definition.");
  }
  return source;
}

function detectOrderingCycle(relations) {
  const edges = relations.filter((relation) => ["before", "after", "requires"].includes(relation.type)).map((relation) => relation.type === "after"
    ? { from: relation.to, to: relation.from }
    : relation);
  const graph = new Map();
  for (const edge of edges) {
    if (!graph.has(edge.from)) graph.set(edge.from, []);
    graph.get(edge.from).push(edge.to);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new LatticeError(FailureCode.CONTRADICTORY_ATOMS, "The contract contains a dependency cycle.", { atomId: id });
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of graph.get(id) ?? []) visit(next);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
}

export function outputKey(output) {
  invariant(Layers.includes(output.layer), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported output layer.");
  invariant(Representations.includes(output.representation), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported output representation.");
  return `${output.layer}:${output.representation}`;
}

export function requiredAtomsFor(contract, output) {
  const accessible = output.representation === "accessibility-equivalent";
  return contract.atoms.filter((atom) => {
    if (!atom.requiredIn.includes(output.layer)) return false;
    if (accessible && atom.delivery?.[output.layer] === "optional") return false;
    return atom.delivery?.[output.layer] !== "optional";
  });
}

export function literalizeAtom(atom) {
  if (atom.literalForm) return atom.literalForm;
  const frame = atom.frame;
  const modality = frame.modality === "is" ? undefined : frame.modality;
  const pieces = [frame.subject, modality, frame.predicate, frame.object, frame.value, frame.unit].filter((value) => value !== undefined && value !== "");
  return `${pieces.join(" ")}${/[.!?]$/u.test(String(pieces.at(-1))) ? "" : "."}`;
}

export function literalize(contract, output) {
  return requiredAtomsFor(contract, output).map(literalizeAtom).join(" ");
}

export function atomCoverage(atom, text) {
  const comparable = normalizeComparable(text);
  const includes = (value) => ` ${comparable} `.includes(` ${normalizeComparable(value)} `);
  if (atom.literalForm && requiresControlledLiteral(atom)) return includes(atom.literalForm);
  const match = atom.match ?? {};
  if ((match.allOf ?? []).some((value) => !includes(value))) return false;
  if ((match.anyOf ?? []).length && !(match.anyOf ?? []).some(includes)) return false;
  if ((match.noneOf ?? []).some(includes)) return false;
  if ((match.allOf ?? []).length || (match.anyOf ?? []).length) {
    const declaredNegation = [...(match.allOf ?? []), ...(match.anyOf ?? [])].some((value) => /\b(?:not|no|never|without|cannot|can't|won't|isn't|doesn't|don't)\b/iu.test(value));
    if (atom.frame.polarity === "positive" && !declaredNegation) {
      const phrases = [...(match.allOf ?? []), ...(match.anyOf ?? [])].map(normalizeComparable).filter(Boolean);
      const relevant = splitSentences(text).filter((sentence) => phrases.some((phrase) => normalizeComparable(sentence).includes(phrase)));
      const negations = new Set(["not", "no", "never", "without", "cannot", "can't", "won't", "isn't", "doesn't", "don't"]);
      if (relevant.some((sentence) => tokenize(sentence).some((token) => negations.has(token)))) return false;
    }
    return true;
  }
  const protectedValues = atom.protectedFields.map((field) => {
    if (field === "conditions") return (atom.frame.conditionIds ?? []).join(" ");
    return atom.frame[field];
  }).filter((value) => value !== undefined && value !== "");
  if (protectedValues.length) return protectedValues.every(includes);
  return [atom.frame.subject, atom.frame.predicate].every(includes);
}

export function coverageFor(contract, output, candidate) {
  const required = requiredAtomsFor(contract, output);
  const mapped = new Set(candidate.atomIds ?? []);
  const unknown = [...mapped].filter((id) => !contract.atoms.some((atom) => atom.id === id));
  invariant(!unknown.length, FailureCode.INVENTED_SEMANTICS, "Candidate maps unknown semantic atoms.", { atomIds: unknown });
  const mappedAtoms = contract.atoms.filter((atom) => mapped.has(atom.id));
  const mappedUncoveredIds = mappedAtoms.filter((atom) => !atomCoverage(atom, candidate.text)).map((atom) => atom.id);
  const covered = required.filter((atom) => mapped.has(atom.id) && atomCoverage(atom, candidate.text));
  return {
    requiredIds: required.map((atom) => atom.id),
    coveredIds: covered.map((atom) => atom.id),
    uncoveredIds: required.filter((atom) => !covered.includes(atom)).map((atom) => atom.id),
    mappedUncoveredIds,
    ratio: required.length ? covered.length / required.length : 1
  };
}
