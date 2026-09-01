export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type Layer = "operative" | "experiential" | "interpretive";
export type Representation = "standard" | "accessibility-equivalent";
export type Stakes = "ambient" | "consequential" | "urgent" | "safety-critical";
export type SafetyClass = "none" | "advisory" | "critical";
export type PriorityName = "safety" | "semantic" | "accessibility" | "clarity" | "domain" | "register" | "ornament";
export type ProfilePriority = "clarity" | "domain" | "register" | "ornament";
export type Conformance = "full" | "degraded" | "literal";

export interface OutputDescriptor {
  layer: Layer;
  representation: Representation;
}

export interface SemanticFrame {
  subject: string;
  predicate: string;
  object?: string;
  value?: string | number;
  unit?: string;
  polarity: "positive" | "negative";
  modality: "must" | "must-not" | "may" | "will" | "might" | "is";
  conditionIds?: string[];
}

export interface SemanticMatch {
  allOf?: string[];
  anyOf?: string[];
  noneOf?: string[];
}

export interface SemanticAtom {
  id: string;
  kind: "action" | "state" | "timing" | "condition" | "constraint" | "consequence" | "prohibition" | "uncertainty" | "recovery" | "relation";
  criticality: "safety" | "operative" | "domain" | "contextual";
  frame: SemanticFrame;
  requiredIn: Layer[];
  delivery?: Partial<Record<Layer, "explicit" | "inferable" | "optional">>;
  protectedFields?: Array<"subject" | "predicate" | "object" | "value" | "unit" | "polarity" | "modality" | "conditions">;
  prohibitedDependencies?: Array<"imagery" | "color" | "sound" | "direction" | "timing-perception" | "implication" | "spatial-inference">;
  literalForm?: string;
  match?: SemanticMatch;
}

export interface SemanticRelation {
  from: string;
  to: string;
  type: "before" | "after" | "causes" | "requires" | "contradicts";
}

export interface MeaningContract {
  id: string;
  revision: string;
  atoms: SemanticAtom[];
  relations?: SemanticRelation[];
  prohibitedClaims?: Array<{ id?: string; literalForm: string }>;
  terminology?: Record<string, string>;
}

export interface RegisterContext {
  domain: string;
  surface: "instruction" | "prompt" | "dialogue" | "conversation" | "transition" | "reflection" | "summary" | "report" | "tooltip" | "tutorial" | "after-action" | "public-notice" | "narration";
  mode: "movement" | "care" | "conversation" | "briefing" | "consequence" | "environment" | "analysis" | "action" | "exposition" | "aftermath" | "technical" | "institutional" | "reflection";
  stakes: Stakes;
  safetyClass: SafetyClass;
  locale: string;
  audience: { knowledgeTags: string[]; readingLevel?: number };
  focalizer?: {
    id: string;
    role?: string;
    expertiseTags?: string[];
    knowledgeTags?: string[];
  };
  channel: {
    visualAvailable: boolean;
    audioAvailable: boolean;
    spatialInferenceAllowed: boolean;
  };
  limits?: {
    maxCharacters?: number;
    maxSentences?: number;
    maxCandidates?: number;
  };
  sceneImportance?: "minor" | "major";
}

export interface ClaimEvidence {
  id: string;
  status: "qualified" | "fictional" | "uncertain";
  atomIds: string[];
  evidenceRefs?: string[];
  [key: string]: unknown;
}

export interface CandidateMetadata {
  dependencies?: Array<"imagery" | "color" | "sound" | "direction" | "timing-perception" | "implication" | "spatial-inference">;
  stateChanges?: string[];
  speakers?: string[];
  speakerObjectives?: Record<string, string>;
  affectedParties?: string[];
  sensoryAnchors?: string[];
  narrativeLayers?: string[];
  causalLinks?: Record<string, unknown>[];
  focalizerId?: string;
  actionGraph?: { actor: string; action: string; result: string; [key: string]: unknown };
  claims?: ClaimEvidence[];
  [key: string]: unknown;
}

export interface RealizationCandidate extends OutputDescriptor {
  id: string;
  text: string;
  atomIds: string[];
  metadata?: CandidateMetadata;
}

export interface RealizationRequest {
  id: string;
  contract: MeaningContract;
  context: RegisterContext;
  outputs: OutputDescriptor[];
  profileIds?: string[];
  candidates?: RealizationCandidate[];
}

export interface LintRequest {
  text: string;
  context: RegisterContext;
  output?: OutputDescriptor;
  profileIds?: string[];
  metadata?: CandidateMetadata;
}

export type Predicate =
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate }
  | { eq: { field: string; value: JsonValue } }
  | { neq: { field: string; value: JsonValue } }
  | { in: { field: string; value: JsonValue[] } }
  | { notIn: { field: string; value: JsonValue[] } }
  | { exists: { field: string; value?: boolean } }
  | { gte: { field: string; value: number } }
  | { lte: { field: string; value: number } }
  | { hasTag: { field: string; value: string } };

export type ValidatorId =
  | "subtext-redundancy"
  | "exposition-state-change"
  | "dialogue-objective"
  | "sentence-variance"
  | "punctuation-restraint"
  | "technical-claims"
  | "externality-presence"
  | "scene-ending"
  | "focal-specificity"
  | "embodied-anchor"
  | "layered-depth"
  | "action-clarity"
  | "manual-review";

export interface RegisterRule {
  id: string;
  revision: string;
  description?: string;
  norm: "must" | "mustNot" | "prefer" | "avoid";
  priority: ProfilePriority;
  enforcement: "hard" | "soft" | "advisory";
  validatorId: ValidatorId;
  appliesWhen?: Predicate;
  dependsOn?: string[];
  conflictsWith?: string[];
  tags?: string[];
  params?: Record<string, JsonValue>;
}

export interface RegisterProfileDefinition {
  id: string;
  version: string;
  title: string;
  description?: string;
  source?: string;
  rules: RegisterRule[];
}

export interface CompiledRegisterProfile extends Required<Pick<RegisterProfileDefinition, "id" | "version" | "title" | "description" | "source" | "rules">> {
  readonly digest: string;
}

export interface Finding {
  ruleId: string;
  status: "pass" | "warn" | "fail" | "unknown" | "not-applicable";
  code: string;
  message: string;
  data: Record<string, JsonValue>;
}

export interface RuleDecision {
  outputKey: string;
  candidateId: string;
  profileId: string;
  ruleId: string;
  disposition: "applied" | "suppressed" | "inapplicable";
  reason: string;
  findingStatus: Finding["status"] | null;
  findingCode: string | null;
}

export interface Coverage {
  requiredIds: string[];
  coveredIds: string[];
  uncoveredIds: string[];
  mappedUncoveredIds: string[];
  ratio: number;
}

export interface RealizedOutput extends OutputDescriptor {
  key: string;
  text: string;
  atomIds: string[];
  candidateId: string;
  source: { kind: "provided" | "literal" };
  conformance: Conformance;
  coverage: Coverage;
  findings: Finding[];
  ruleDecisions: RuleDecision[];
}

export interface ReceiptOutput {
  key: string;
  candidateId: string;
  digest: string;
  conformance: Conformance;
}

export interface DerivationReceipt {
  schemaVersion: string;
  engine: { name: string; version: string };
  requestId: string;
  runId: string;
  inputDigest: string;
  dependencies: { profileDigests: Array<{ id: string; version: string; digest: string }> };
  outputs: ReceiptOutput[];
  candidates: Array<{
    outputKey: string;
    candidateId: string;
    digest: string;
    selected: boolean;
    source: "provided" | "literal";
    rank: number[];
    rejectionCodes: string[];
  }>;
  decisions: RuleDecision[];
  assurance: {
    deterministic: true;
    networkIndependent: true;
    semanticScope: "declared-contract-and-registered-claims";
    externallyAnchored: false;
  };
  trustScope: "reproducibility-and-conformance-only";
  derivationDigest: string;
}

export interface RealizationResult {
  engine: { name: string; version: string };
  requestId: string;
  conformance: Conformance;
  outputs: RealizedOutput[];
  receipt: DerivationReceipt;
}

export interface LintResult {
  advisoryOnly: true;
  semanticGuarantee: false;
  findings: Finding[];
  ruleDecisions: RuleDecision[];
}

export interface VerificationResult {
  valid: true;
  integrity: "self-consistent";
  authenticated: false;
  derivationDigest: string;
}

export interface EngineOptions {
  profiles?: Array<RegisterProfileDefinition | CompiledRegisterProfile>;
}

export interface LatticeEngine {
  readonly name: string;
  readonly version: string;
  readonly profiles: ReadonlyArray<{ id: string; version: string; title: string; digest: string }>;
  realize(request: RealizationRequest): RealizationResult;
  lint(input: LintRequest): LintResult;
}

export class LatticeError extends Error {
  constructor(code: string, message: string, details?: Record<string, unknown>);
  readonly name: "LatticeError";
  readonly code: string;
  readonly details: Record<string, unknown>;
}

export const FailureCode: Readonly<Record<string, string>>;
export const ENGINE_NAME: string;
export const ENGINE_VERSION: string;
export const EVIDENCE_SCHEMA_VERSION: string;
export const Layers: readonly Layer[];
export const Representations: readonly Representation[];
export const SafetyClasses: readonly SafetyClass[];
export const Stakes: readonly Stakes[];
export const Limits: Readonly<Record<string, number>>;
export const Priority: Readonly<Record<PriorityName, number>>;

export function createEngine(options?: EngineOptions): LatticeEngine;
export function lintText(input: LintRequest, options?: EngineOptions): LintResult;
export function verifyReceipt(receipt: DerivationReceipt | unknown): VerificationResult;
export function verifyResult(result: RealizationResult | unknown): VerificationResult;
export function compileProfile(profile: RegisterProfileDefinition): CompiledRegisterProfile;

export const relationalSystemsDefinition: RegisterProfileDefinition;
export const relationalSystemsProfile: CompiledRegisterProfile;

export function requiresControlledLiteral(atom: SemanticAtom): boolean;
export function validateContract(contract: MeaningContract): MeaningContract;
export function outputKey(output: OutputDescriptor): string;
export function requiredAtomsFor(contract: MeaningContract, output: OutputDescriptor): SemanticAtom[];
export function literalizeAtom(atom: SemanticAtom): string;
export function literalize(contract: MeaningContract, output: OutputDescriptor): string;
export function coverageFor(contract: MeaningContract, output: OutputDescriptor, candidate: Pick<RealizationCandidate, "text" | "atomIds">): Coverage;
