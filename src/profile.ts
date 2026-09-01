import { EngineRulePrefix, Limits, Priority, ProtectedPriorities } from "./constants.ts";
import { FailureCode, invariant, LatticeError } from "./errors.ts";
import { assertIdentifier, assertPlainData, assertVersion, deepFreeze, digest, unique } from "./util.ts";
import { validatePredicate, evaluatePredicate } from "./predicates.ts";
import { KnownValidators } from "./validators.ts";

const norms = new Set(["must", "mustNot", "prefer", "avoid"]);
const enforcementLevels = new Set(["hard", "soft", "advisory"]);
const profileFields = new Set(["id", "version", "title", "description", "source", "rules"]);
const ruleFields = new Set(["id", "revision", "description", "norm", "priority", "enforcement", "validatorId", "appliesWhen", "dependsOn", "conflictsWith", "tags", "params"]);

export function compileProfile(source) {
  assertPlainData(source, "profile");
  invariant(source && typeof source === "object" && !Array.isArray(source), FailureCode.PROFILE_CONFLICT, "A profile object is required.");
  const unknownProfileFields = Object.keys(source).filter((field) => !profileFields.has(field));
  invariant(!unknownProfileFields.length, FailureCode.PROFILE_CONFLICT, "Profile contains unsupported fields.", { fields: unknownProfileFields });
  assertIdentifier(source.id, "Profile ID");
  assertVersion(source.version, "Profile version");
  invariant(typeof source.title === "string" && source.title.trim(), FailureCode.PROFILE_CONFLICT, "A profile title is required.");
  invariant(Array.isArray(source.rules) && source.rules.length > 0, FailureCode.PROFILE_CONFLICT, "A profile requires rules.");
  invariant(source.rules.length <= Limits.maxRules, FailureCode.EXECUTION_BOUND, "The profile contains too many rules.");

  const ids = new Set();
  const normalized = source.rules.map((rule) => {
    const unknownRuleFields = Object.keys(rule).filter((field) => !ruleFields.has(field));
    invariant(!unknownRuleFields.length, FailureCode.PROFILE_CONFLICT, "Profile rule contains unsupported fields.", { ruleId: rule.id, fields: unknownRuleFields });
    assertIdentifier(rule.id, "Rule ID");
    invariant(!rule.id.startsWith(EngineRulePrefix), FailureCode.PROFILE_CONFLICT, "Profiles cannot use the engine-reserved rule namespace.", { ruleId: rule.id });
    invariant(!ids.has(rule.id), FailureCode.PROFILE_CONFLICT, "Rule IDs must be unique.", { ruleId: rule.id });
    ids.add(rule.id);
    assertVersion(rule.revision, `Rule ${rule.id} revision`);
    invariant(norms.has(rule.norm), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} has an unsupported norm.`);
    invariant(Object.hasOwn(Priority, rule.priority), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} has an unsupported priority.`);
    invariant(!ProtectedPriorities.has(rule.priority), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} attempts to redefine a protected priority.`);
    invariant(enforcementLevels.has(rule.enforcement), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} has unsupported enforcement.`);
    invariant(KnownValidators.has(rule.validatorId), FailureCode.UNKNOWN_VALIDATOR, `Rule ${rule.id} uses an unknown validator.`, { validatorId: rule.validatorId });
    rule.appliesWhen = rule.appliesWhen ?? { exists: { field: "layer", value: true } };
    validatePredicate(rule.appliesWhen);
    rule.dependsOn = rule.dependsOn ?? [];
    rule.conflictsWith = rule.conflictsWith ?? [];
    rule.tags = rule.tags ?? [];
    rule.params = rule.params ?? {};
    for (const [field, values] of [["dependsOn", rule.dependsOn], ["conflictsWith", rule.conflictsWith], ["tags", rule.tags]]) {
      invariant(Array.isArray(values), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} ${field} must be an array.`);
      invariant(unique(values).length === values.length, FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} ${field} contains duplicates.`);
      values.forEach((value) => assertIdentifier(value, `Rule ${rule.id} ${field} value`));
    }
    invariant(!rule.dependsOn.includes(rule.id), FailureCode.PROFILE_CYCLE, `Rule ${rule.id} cannot depend on itself.`);
    invariant(!rule.conflictsWith.includes(rule.id), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} cannot conflict with itself.`);
    invariant(rule.params && typeof rule.params === "object" && !Array.isArray(rule.params), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} params must be an object.`);
    return rule;
  });

  for (const rule of normalized) {
    for (const dependency of rule.dependsOn) invariant(ids.has(dependency), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} has an unresolved dependency.`, { dependency });
    for (const conflict of rule.conflictsWith) invariant(ids.has(conflict), FailureCode.PROFILE_CONFLICT, `Rule ${rule.id} has an unresolved conflict.`, { conflict });
  }
  detectCycles(normalized);
  detectUndeclaredConflicts(normalized);

  const compiled = {
    id: source.id,
    version: source.version,
    title: source.title,
    description: source.description ?? "",
    source: source.source ?? "RSR-SPEC-v1",
    rules: normalized,
    digest: digest({ id: source.id, version: source.version, title: source.title, rules: normalized })
  };
  return deepFreeze(compiled);
}

function detectCycles(rules) {
  const graph = new Map(rules.map((rule) => [rule.id, rule.dependsOn]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new LatticeError(FailureCode.PROFILE_CYCLE, "Profile rule dependencies contain a cycle.", { ruleId: id });
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of graph.get(id) ?? []) visit(next);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
}

function detectUndeclaredConflicts(rules) {
  for (let leftIndex = 0; leftIndex < rules.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rules.length; rightIndex += 1) {
      const left = rules[leftIndex];
      const right = rules[rightIndex];
      if (left.validatorId !== right.validatorId || left.priority !== right.priority) continue;
      const opposing = new Set([left.norm, right.norm]);
      if (!(opposing.has("must") && opposing.has("mustNot"))) continue;
      const declared = left.conflictsWith.includes(right.id) || right.conflictsWith.includes(left.id);
      const bothHard = left.enforcement === "hard" && right.enforcement === "hard";
      invariant(declared && !bothHard, FailureCode.PROFILE_CONFLICT, bothHard
        ? "Profile contains an unsatisfiable same-tier hard conflict."
        : "Profile contains an undeclared same-tier conflict.", { ruleIds: [left.id, right.id] });
    }
  }
}

export function resolveRules(profile, environment, blockedTags = []) {
  const blocked = new Set(blockedTags);
  const resolutions = profile.rules.map((rule) => {
    const applicable = evaluatePredicate(rule.appliesWhen, environment);
    if (!applicable) return { rule, disposition: "inapplicable", reason: "predicate_false" };
    if (rule.tags.some((tag) => blocked.has(tag))) return { rule, disposition: "suppressed", reason: "protected_context" };
    return { rule, disposition: "applied", reason: "predicate_true" };
  }).sort((left, right) => Priority[right.rule.priority] - Priority[left.rule.priority] || left.rule.id.localeCompare(right.rule.id));

  const byId = new Map(resolutions.map((resolution) => [resolution.rule.id, resolution]));
  for (let leftIndex = 0; leftIndex < resolutions.length; leftIndex += 1) {
    const left = resolutions[leftIndex];
    if (left.disposition !== "applied") continue;
    for (let rightIndex = leftIndex + 1; rightIndex < resolutions.length; rightIndex += 1) {
      const right = resolutions[rightIndex];
      if (right.disposition !== "applied") continue;
      const conflicts = left.rule.conflictsWith.includes(right.rule.id) || right.rule.conflictsWith.includes(left.rule.id);
      if (conflicts) {
        right.disposition = "suppressed";
        right.reason = `conflict_with:${left.rule.id}`;
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const resolution of resolutions) {
      if (resolution.disposition !== "applied") continue;
      const missing = resolution.rule.dependsOn.find((id) => byId.get(id)?.disposition !== "applied");
      if (missing) {
        resolution.disposition = "suppressed";
        resolution.reason = `dependency_unavailable:${missing}`;
        changed = true;
      }
    }
  }
  return resolutions;
}
