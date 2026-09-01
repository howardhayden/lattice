export const ENGINE_VERSION = "0.1.1";
export const EVIDENCE_SCHEMA_VERSION = "lre.receipt.v1";

export const Priority = Object.freeze({
  safety: 700,
  semantic: 600,
  accessibility: 500,
  clarity: 400,
  domain: 300,
  register: 200,
  ornament: 100
});

export const Layers = Object.freeze(["operative", "experiential", "interpretive"]);
export const Representations = Object.freeze(["standard", "accessibility-equivalent"]);
export const Stakes = Object.freeze(["ambient", "consequential", "urgent", "safety-critical"]);
export const SafetyClasses = Object.freeze(["none", "advisory", "critical"]);

export const Limits = Object.freeze({
  maxInputCharacters: 100_000,
  maxOutputCharacters: 50_000,
  maxAtoms: 200,
  maxRelations: 400,
  maxCandidates: 50,
  maxProfiles: 16,
  maxRules: 256,
  maxActiveRules: 256,
  maxReceiptDecisions: 14_336,
  maxPlainArrayItems: 20_000,
  maxPlainObjectKeys: 1_000,
  maxPredicateDepth: 8,
  maxPredicateNodes: 64,
  maxIdentifierLength: 128
});

export const ProtectedPriorities = Object.freeze(new Set(["safety", "semantic", "accessibility"]));
export const EngineRulePrefix = "LRE-";
