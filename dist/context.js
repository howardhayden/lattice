import { Layers, Limits, Representations, SafetyClasses, Stakes } from "./constants.js";
import { FailureCode, invariant } from "./errors.js";
import { assertIdentifier, normalizeText, unique } from "./util.js";

const surfaces = new Set(["instruction", "prompt", "dialogue", "conversation", "transition", "reflection", "summary", "report", "tooltip", "tutorial", "after-action", "public-notice", "narration"]);
const modes = new Set(["movement", "care", "conversation", "briefing", "consequence", "environment", "analysis", "action", "exposition", "aftermath", "technical", "institutional", "reflection"]);

function validateTags(values, label) {
  invariant(Array.isArray(values), FailureCode.UNSUPPORTED_CONTEXT, `${label} must be an array.`);
  const normalized = values.map((value) => normalizeText(value, label).trim());
  invariant(normalized.every((value) => value.length > 0 && value.length <= 128), FailureCode.UNSUPPORTED_CONTEXT, `${label} contains an invalid tag.`);
  invariant(unique(normalized).length === normalized.length, FailureCode.UNSUPPORTED_CONTEXT, `${label} contains duplicate tags.`);
  return normalized;
}

export function validateContext(context) {
  invariant(context && typeof context === "object" && !Array.isArray(context), FailureCode.UNSUPPORTED_CONTEXT, "A register context is required.");
  assertIdentifier(context.domain, "Context domain");
  invariant(surfaces.has(context.surface), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported surface.", { surface: context.surface });
  invariant(modes.has(context.mode), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported mode.", { mode: context.mode });
  invariant(Stakes.includes(context.stakes), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported stakes value.");
  invariant(SafetyClasses.includes(context.safetyClass), FailureCode.UNSUPPORTED_CONTEXT, "safetyClass must be explicit.");
  invariant(typeof context.locale === "string" && context.locale.trim(), FailureCode.UNSUPPORTED_CONTEXT, "A locale is required.");
  context.locale = normalizeText(context.locale, "Context locale").trim();
  invariant(context.locale.length <= 64, FailureCode.UNSUPPORTED_CONTEXT, "Context locale is too long.");
  invariant(context.audience && Array.isArray(context.audience.knowledgeTags), FailureCode.UNSUPPORTED_CONTEXT, "Audience knowledge tags are required.");
  context.audience.knowledgeTags = validateTags(context.audience.knowledgeTags, "Audience knowledge tags");
  if (context.audience.readingLevel !== undefined) invariant(Number.isInteger(context.audience.readingLevel) && context.audience.readingLevel >= 1 && context.audience.readingLevel <= 20, FailureCode.UNSUPPORTED_CONTEXT, "Audience readingLevel must be an integer from 1 through 20.");
  if (context.focalizer) {
    assertIdentifier(context.focalizer.id, "Focalizer ID");
    if (context.focalizer.role !== undefined) assertIdentifier(context.focalizer.role, "Focalizer role");
    context.focalizer.expertiseTags = validateTags(context.focalizer.expertiseTags ?? [], "Focalizer expertise tags");
    context.focalizer.knowledgeTags = validateTags(context.focalizer.knowledgeTags ?? [], "Focalizer knowledge tags");
  }
  invariant(context.channel && typeof context.channel === "object", FailureCode.UNSUPPORTED_CONTEXT, "Channel capabilities are required.");
  for (const field of ["visualAvailable", "audioAvailable", "spatialInferenceAllowed"]) {
    invariant(typeof context.channel[field] === "boolean", FailureCode.UNSUPPORTED_CONTEXT, `channel.${field} must be explicit.`);
  }
  context.limits = context.limits ?? {};
  const numericLimits = {
    maxCharacters: Limits.maxOutputCharacters,
    maxSentences: 1000,
    maxCandidates: Limits.maxCandidates
  };
  for (const [field, maximum] of Object.entries(numericLimits)) {
    if (context.limits[field] === undefined) continue;
    invariant(Number.isInteger(context.limits[field]) && context.limits[field] > 0 && context.limits[field] <= maximum, FailureCode.EXECUTION_BOUND, `context.limits.${field} is invalid.`);
  }
  if (context.sceneImportance !== undefined) invariant(["minor", "major"].includes(context.sceneImportance), FailureCode.UNSUPPORTED_CONTEXT, "sceneImportance is invalid.");
  return context;
}

export function normalizeOutputs(outputs, context) {
  invariant(Array.isArray(outputs) && outputs.length > 0, FailureCode.UNSUPPORTED_CONTEXT, "At least one output is required.");
  invariant(outputs.length <= Layers.length * Representations.length, FailureCode.EXECUTION_BOUND, "Too many outputs were requested.");
  const normalized = outputs.map((output) => {
    invariant(Layers.includes(output.layer), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported output layer.");
    invariant(Representations.includes(output.representation), FailureCode.UNSUPPORTED_CONTEXT, "Unsupported output representation.");
    return { layer: output.layer, representation: output.representation };
  });
  for (const output of [...normalized]) {
    if (output.representation === "accessibility-equivalent") {
      normalized.push({ layer: output.layer, representation: "standard" });
    }
  }
  if (context.stakes === "safety-critical" || context.safetyClass === "critical") {
    normalized.push(
      { layer: "operative", representation: "standard" },
      { layer: "operative", representation: "accessibility-equivalent" }
    );
  }
  const keys = new Set();
  const layerRank = new Map(Layers.map((layer, index) => [layer, index]));
  const representationRank = new Map(Representations.map((representation, index) => [representation, index]));
  return normalized.filter((output) => {
    const key = `${output.layer}:${output.representation}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  }).sort((left, right) => layerRank.get(left.layer) - layerRank.get(right.layer)
    || representationRank.get(left.representation) - representationRank.get(right.representation));
}

export function protectedTags(context, output) {
  const tags = [];
  if (context.stakes === "safety-critical" || context.safetyClass === "critical") tags.push("figurative", "subtext", "ornament", "implicit-critical");
  if (output.layer === "operative") tags.push("ornament", "subtext");
  if (output.representation === "accessibility-equivalent") tags.push("imagery-dependent", "sound-dependent", "color-dependent", "spatial-dependent");
  return unique(tags);
}
