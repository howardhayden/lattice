import { createHash } from "node:crypto";
import { FailureCode, invariant } from "./errors.ts";
import { Limits } from "./constants.ts";

const identifierPattern = /^[A-Za-z][A-Za-z0-9._:@-]*$/u;
const versionPattern = /^[0-9A-Za-z][0-9A-Za-z._+-]*$/u;
const controlPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/u;
const zeroWidthPattern = /[\u200B-\u200D\u2060\uFEFF]/gu;

export function normalizeText(value, label = "text") {
  invariant(typeof value === "string", FailureCode.INVALID_INPUT, `${label} must be a string.`);
  invariant(value.length <= Limits.maxInputCharacters, FailureCode.EXECUTION_BOUND, `${label} exceeds the input bound.`);
  invariant(!controlPattern.test(value), FailureCode.INVALID_INPUT, `${label} contains disallowed control characters.`);
  return value.normalize("NFKC").replace(zeroWidthPattern, "").replace(/\r\n?/gu, "\n");
}

export function normalizeComparable(value) {
  return normalizeText(String(value)).toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function assertIdentifier(value, label = "identifier") {
  invariant(typeof value === "string", FailureCode.INVALID_INPUT, `${label} must be a string.`);
  invariant(value.length > 0 && value.length <= Limits.maxIdentifierLength, FailureCode.INVALID_INPUT, `${label} has an invalid length.`);
  invariant(identifierPattern.test(value), FailureCode.INVALID_INPUT, `${label} contains unsupported characters.`);
  const normalized = value.normalize("NFKC");
  invariant(normalized === value, FailureCode.INVALID_INPUT, `${label} must already be NFKC-normalized.`);
  return value;
}

export function assertVersion(value, label = "version") {
  invariant(typeof value === "string", FailureCode.INVALID_INPUT, `${label} must be a string.`);
  invariant(value.length > 0 && value.length <= Limits.maxIdentifierLength, FailureCode.INVALID_INPUT, `${label} has an invalid length.`);
  invariant(versionPattern.test(value), FailureCode.INVALID_INPUT, `${label} contains unsupported characters.`);
  invariant(value.normalize("NFKC") === value, FailureCode.INVALID_INPUT, `${label} must already be NFKC-normalized.`);
  return value;
}

export function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function assertPlainData(value, path = "value", depth = 0) {
  invariant(depth <= 32, FailureCode.EXECUTION_BOUND, `${path} exceeds the nesting bound.`);
  if (value === undefined || value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    invariant(Number.isFinite(value), FailureCode.INVALID_INPUT, `${path} contains a non-finite number.`);
    return;
  }
  if (Array.isArray(value)) {
    invariant(value.length <= Limits.maxPlainArrayItems, FailureCode.EXECUTION_BOUND, `${path} contains too many items.`);
    invariant(!value.some((entry) => entry === undefined), FailureCode.INVALID_INPUT, `${path} cannot contain undefined array entries.`);
    value.forEach((entry, index) => assertPlainData(entry, `${path}[${index}]`, depth + 1));
    return;
  }
  invariant(isPlainObject(value), FailureCode.INVALID_INPUT, `${path} must contain declarative data only.`);
  const keys = Object.keys(value);
  invariant(keys.length <= Limits.maxPlainObjectKeys, FailureCode.EXECUTION_BOUND, `${path} contains too many fields.`);
  for (const key of keys) {
    invariant(!["__proto__", "prototype", "constructor"].includes(key), FailureCode.INVALID_INPUT, `${path} contains a prohibited key.`);
    assertPlainData(value[key], `${path}.${key}`, depth + 1);
  }
}

export function canonicalize(value) {
  assertPlainData(value);
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const result = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] !== undefined) result[key] = canonicalize(value[key]);
  }
  return result;
}

export function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function digest(value) {
  return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

export function tokenize(text) {
  return normalizeText(text).toLocaleLowerCase("en-US").match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
}

export function splitSentences(text) {
  return normalizeText(text).split(/(?<=[.!?…])\s+(?=["“'‘(\[]*[A-Z0-9])/u).map((entry) => entry.trim()).filter(Boolean);
}

export function contentTokens(text) {
  const stop = new Set(["a", "an", "and", "as", "at", "be", "but", "by", "for", "from", "he", "her", "his", "i", "in", "is", "it", "of", "on", "or", "she", "that", "the", "their", "they", "this", "to", "was", "we", "were", "with", "you", "your"]);
  return new Set(tokenize(text).filter((token) => !stop.has(token)));
}

export function jaccard(left, right) {
  const a = contentTokens(left);
  const b = contentTokens(right);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection || 1);
}

export function unique(values) {
  return [...new Set(values)];
}

export function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function standardDeviation(values) {
  if (!values.length) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

export function compareRank(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return right[index] - left[index];
  }
  return 0;
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const entry of Object.values(value)) deepFreeze(entry);
  }
  return value;
}
