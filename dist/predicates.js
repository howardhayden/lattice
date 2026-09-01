import { Limits } from "./constants.js";
import { FailureCode, invariant } from "./errors.js";

const fields = new Set([
  "layer", "representation", "surface", "mode", "stakes", "safetyClass", "domain",
  "audience.readingLevel", "focalizer.id", "focalizer.role", "channel.visualAvailable",
  "channel.audioAvailable", "channel.spatialInferenceAllowed", "audience.knowledgeTags",
  "focalizer.expertiseTags", "focalizer.knowledgeTags"
]);
const operators = new Set(["eq", "neq", "in", "notIn", "exists", "gte", "lte", "hasTag"]);

function getPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

export function validatePredicate(node, depth = 0, state = { nodes: 0 }) {
  state.nodes += 1;
  invariant(depth <= Limits.maxPredicateDepth && state.nodes <= Limits.maxPredicateNodes, FailureCode.EXECUTION_BOUND, "Predicate exceeds compilation bounds.");
  invariant(node && typeof node === "object" && !Array.isArray(node), FailureCode.PROFILE_CONFLICT, "Predicate nodes must be objects.");
  const keys = Object.keys(node);
  invariant(keys.length === 1, FailureCode.PROFILE_CONFLICT, "Predicate nodes require exactly one operation.");
  const key = keys[0];
  if (["all", "any"].includes(key)) {
    invariant(Array.isArray(node[key]) && node[key].length > 0, FailureCode.PROFILE_CONFLICT, `${key} predicates require children.`);
    node[key].forEach((child) => validatePredicate(child, depth + 1, state));
    return node;
  }
  if (key === "not") {
    validatePredicate(node.not, depth + 1, state);
    return node;
  }
  invariant(operators.has(key), FailureCode.PROFILE_CONFLICT, "Unknown predicate operation.", { operation: key });
  const expression = node[key];
  invariant(expression && typeof expression === "object" && !Array.isArray(expression), FailureCode.PROFILE_CONFLICT, "Predicate expressions must be objects.");
  invariant(Object.keys(expression).every((field) => ["field", "value"].includes(field)), FailureCode.PROFILE_CONFLICT, "Predicate expression contains unsupported fields.");
  invariant(fields.has(expression.field), FailureCode.PROFILE_CONFLICT, "Predicate references an unsupported field.", { field: expression.field });
  invariant(Object.hasOwn(expression, "value"), FailureCode.PROFILE_CONFLICT, `${key} requires a value.`);
  if (["in", "notIn"].includes(key)) invariant(Array.isArray(expression.value) && expression.value.length > 0, FailureCode.PROFILE_CONFLICT, `${key} requires a non-empty array value.`);
  if (["gte", "lte"].includes(key)) invariant(typeof expression.value === "number" && Number.isFinite(expression.value), FailureCode.PROFILE_CONFLICT, `${key} requires a finite numeric value.`);
  if (key === "exists") invariant(typeof expression.value === "boolean", FailureCode.PROFILE_CONFLICT, "exists requires a boolean value.");
  if (key === "hasTag") {
    invariant(["audience.knowledgeTags", "focalizer.expertiseTags", "focalizer.knowledgeTags"].includes(expression.field), FailureCode.PROFILE_CONFLICT, "hasTag requires a supported tag-array field.");
    invariant(typeof expression.value === "string" && expression.value.length > 0, FailureCode.PROFILE_CONFLICT, "hasTag requires a non-empty string value.");
  }
  return node;
}

export function evaluatePredicate(node, environment) {
  const key = Object.keys(node)[0];
  if (key === "all") return node.all.every((child) => evaluatePredicate(child, environment));
  if (key === "any") return node.any.some((child) => evaluatePredicate(child, environment));
  if (key === "not") return !evaluatePredicate(node.not, environment);
  const expression = node[key];
  const observed = getPath(environment, expression.field);
  if (key === "eq") return observed === expression.value;
  if (key === "neq") return observed !== expression.value;
  if (key === "in") return expression.value.includes(observed);
  if (key === "notIn") return !expression.value.includes(observed);
  if (key === "exists") return expression.value === false ? observed === undefined : observed !== undefined;
  if (key === "gte") return typeof observed === "number" && observed >= expression.value;
  if (key === "lte") return typeof observed === "number" && observed <= expression.value;
  if (key === "hasTag") {
    const tags = getPath(environment, expression.field);
    return Array.isArray(tags) && tags.includes(expression.value);
  }
  return false;
}
