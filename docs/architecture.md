# Lattice architecture

## 1. Purpose

Lattice is a deterministic realization and validation engine. Its central architectural separation is:

```text
meaning contract ≠ register policy ≠ surface realization ≠ presentation
```

The engine accepts structured meaning, explicit context, compiled register rules, and bounded candidate realizations. It produces layered plain-text outputs and derivation evidence. It does not ask a probabilistic model to discover what the caller meant.

This design makes semantic preservation testable by construction. It also limits what the engine can honestly claim: Lattice can verify registered coverage and controlled transformations, but it cannot infer truth or literary value from prose alone.

## 2. Trust boundaries

| Boundary | Lattice accepts | Lattice guarantees | Lattice does not guarantee |
| --- | --- | --- | --- |
| Meaning | Typed atoms and relations | Required atoms remain represented according to their delivery policy | Input facts are true |
| Context | Explicit domain, surface, mode, stakes, safety class, audience, focalizer, and channel | Rule applicability is resolved from recorded values | Missing context can be guessed safely |
| Register | Declarative rules and bounded validator parameters | Compiled rules cannot outrank protected engine policies | A profile is artistically good |
| Realization | Controlled literals and mapped candidates | Selected text passes applicable hard gates | Arbitrary free-form paraphrase preserves meaning |
| Evidence | Canonical inputs, dependency versions, decisions, findings, and output | A verifier can recompute internal derivation consistency | A self-consistent receipt proves authenticity |

## 3. Core data model

### 3.1 Meaning contract

A meaning contract contains independently identifiable semantic atoms. Each atom records:

- a semantic kind, such as action, state, timing, condition, consequence, prohibition, uncertainty, recovery, or relation;
- a structured frame containing subject, predicate, object, value, unit, polarity, modality, and condition references where applicable;
- criticality;
- the content layers in which it is required;
- whether delivery in each layer must be explicit, may be inferable, or is optional;
- controlled literal wording where critical delivery requires it;
- protected fields that transformations cannot alter;
- channel or inference dependencies that are prohibited.

Relations connect atoms through `before`, `after`, `requires`, `causes`, or `contradicts`. Ordering and dependency cycles are rejected where they make realization incoherent.

Safety and operative atoms require controlled literal forms and operative-layer coverage. A profile cannot set or downgrade atom criticality, request stakes, safety class, protected fields, or delivery requirements.

### 3.2 Register context

Context is explicit input, not ambient process state. It includes:

- domain;
- surface;
- mode;
- stakes;
- safety class;
- locale;
- audience knowledge and reading level;
- focalizer identity, expertise, knowledge, role, state, and immediate objective when applicable;
- available visual, audio, and spatial channels;
- bounded output and candidate limits.

Unknown high-priority context fails closed. The engine does not inspect system time, host locale, user identity, environment variables, network state, or previous runs to fill missing values.

### 3.3 Content layer and representation

Content and accessibility are orthogonal dimensions:

```text
ContentLayer = operative | experiential | interpretive
Representation = standard | accessibility-equivalent
```

This prevents an accessibility equivalent from becoming a fourth, semantically divergent narrative. It is another realization of the same relevant atoms.

### 3.4 Register profile

A profile contains stable IDs and versions for:

- declarative rules;
- applicability predicates;
- registered validators;
- bounded parameters;
- cadence, discourse, and other validation parameters;
- declared dependencies and conflicts.

Profiles may define contextual clarity, domain, register, or ornament rules. Safety, semantic, and accessibility rules are engine-owned. Profiles cannot replace or weaken engine-owned operative-clarity rules when the context or contract makes clarity a hard requirement.

Applicability predicates use a restricted abstract syntax tree. They may compare only allowlisted context fields with bounded `all`, `any`, `not`, equality, membership, existence, tag, and numeric operations. Arbitrary JavaScript, regular-expression transforms, evaluation, dynamic imports, and network-backed rules are excluded.

Profiles do not contain executable transformations. The current engine applies registered validators to candidate text and metadata; it does not let profile data mutate semantic slots or rewrite strings.

## 4. Pipeline

### 4.1 Validation and normalization

Inputs are accepted only as bounded declarative data. The parser and validators reject:

- duplicate or unsupported identifiers in the validated object model;
- prohibited object keys;
- control and zero-width characters outside normalization policy;
- non-finite numbers;
- excessive nesting, arrays, rules, atoms, relations, candidates, or output sizes;
- unsupported atom, context, predicate, validator, layer, representation, or relation types.

Canonical values are NFKC-normalized where required and serialized with stable key ordering before hashing. Callers that deserialize JSON are responsible for using a parser capable of rejecting duplicate object keys before information is lost during parsing.

### 4.2 Contract validation

Contract validation checks:

- unique atom IDs;
- complete frames;
- valid polarity and modality;
- contradictions between otherwise equivalent atoms;
- valid relation targets and acyclic protected ordering;
- controlled literal forms for safety and operative atoms;
- explicit operative coverage for critical content;
- recognized delivery and prohibited-dependency values.

An invalid contract produces a typed failure before register rules are considered.

### 4.3 Profile compilation

Compilation checks rule IDs, versions, norms, priority tiers, validators, applicability expressions, dependencies, conflicts, and execution bounds.

Same-tier hard `must` and `mustNot` conflicts invalidate profile composition. They cannot be resolved by file order, profile order, score, or an unrecorded fallback.

Compiled profiles are deeply frozen. Their canonical digest participates in every derivation receipt.

### 4.4 Rule resolution

Each rule receives one applicability disposition for each governed output:

- `applied` — its predicate passed and no higher policy blocked it;
- `suppressed` — a protected context or higher policy forbade it;
- `inapplicable` — its predicate did not apply.

An applied rule then receives a separate validation result such as `pass`, `warn`, `fail`, `unknown`, or `not-applicable`. Keeping applicability separate from evaluation prevents an executed rule that failed from being mistaken for a rule that was never applicable.

The disposition and reason code are evidence. Suppression is never silently treated as application.

### 4.5 Shared semantic planning

All requested outputs derive from one validated contract and normalized output plan. The contract records the required atom set and protected ordering; candidate metadata may register state changes, causal links, focalization, speakers, claims, and other evidence used by profile validators.

Layer planning then determines which atoms and relations each output must express. Experiential and interpretive layers may vary emphasis and framing, but may not introduce uncontracted actions, facts, causes, certainty, authority, or consequences.

### 4.6 Deterministic realization and candidate selection

For each output, the caller may supply mapped candidate text. If no candidate targets that output, the engine constructs a deterministic literal candidate by joining the literal forms or structured frames of its required atoms. That fallback is labeled `literal`, not full profile conformance. The engine does not pass prose through an opaque rewrite model and does not synthesize new literary candidates.

Candidate evaluation is bounded and stably ordered. The full normalized request, including candidate text and metadata, participates in the input digest.

Every candidate records:

- its text;
- output layer and representation;
- semantic atom IDs;
- validation metadata;
- whether it was caller-provided or constructed as a literal baseline.

Applied rules and findings for the selected candidate are exposed alongside its output. The receipt records candidate-addressable rule decisions for every evaluated candidate, including rejected alternatives.

### 4.7 Hard validation

The following concerns form a non-tradeable hard set whenever applicable:

1. safety;
2. semantic fidelity;
3. accessibility equivalence;
4. operative clarity;
5. authoritative domain correctness.

Hard validation checks include required atom coverage, critical literalness, protected field preservation, prohibited claims, ordering, invented semantics, accessibility dependencies, action clarity, bounded plain-text output, and cross-layer contradiction.

Safety and required atoms may never be inferable or optional in operative or accessibility-equivalent output. Unknown results at a hard tier fail; they do not count as passes.

### 4.8 Register validation

Profile validators inspect concerns such as:

- repeated inference;
- exposition without a registered state change or deferred payoff;
- missing dialogue objectives;
- inappropriate cadence variance or punctuation intensity;
- unsupported technical claims;
- absent externalities at consequential stakes;
- redundant closure;
- unproven focal specificity;
- missing embodied anchors;
- narrative layers without registered causal links.

Some checks are deterministic; others rely on caller-supplied metadata or require human review. Advisory findings can affect selection inside their tier but cannot certify or defeat a hard gate.

### 4.9 Ranking

Candidates that fail a hard gate are excluded. Remaining candidates are ranked lexicographically:

```text
semantic coverage
→ accessibility parity
→ operative clarity
→ domain correctness
→ register fit
→ lower redundancy
→ lower ornamental cost
```

Weights may compare candidates only inside a tier. Scores never trade meaning or safety for style. Stable candidate IDs or digests break complete ties.

A literal baseline is not an unconditional escape hatch. It must pass every hard gate. If soft profile rules are suppressed, a passing baseline may be returned only with an explicit degraded or nonconformant profile status and complete suppression evidence.

### 4.10 Evidence

A derivation receipt contains:

- a canonical normalized-request digest;
- engine identity and version;
- active profile identities, versions, and digests;
- every rule disposition and reason;
- candidate digests, selection, rank, and rejection codes;
- selected-output conformance states and rule findings exposed by the result;
- selected output digest;
- derivation digest;
- an explicit trust scope limited to reproducibility and conformance.

Receipt verification checks the closed receipt shape, candidate-selection topology, decision references, fixed assurance scope, and recomputed digest. Result verification additionally binds every returned output field and derives aggregate conformance. These checks establish self-consistency, not authentication. Full semantic replay requires the original request and dependency versions; a receipt by itself does not carry enough information to rerun contract coverage, hard gates, profile findings, or candidate selection.

An optional append-only local event chain can record receipt digests. The chain establishes internal continuity only. A fully regenerated chain remains self-consistent, not authenticated, unless verified against an independently retained anchor.

## 5. Determinism and local-first behavior

For canonical input tuple (I):

```text
I = normalized request
  + selected profile bundle and versions
  + engine version
```

Lattice requires:

```text
realize(I) = byte-identical output and derivation digest
```

The core performs no network access, telemetry, remote inference, dynamic code download, implicit environment lookup, or uncontrolled random selection. Evidence persistence is opt-in and supplied by the host.

## 6. Failure behavior

Lattice returns typed failures for incomplete or contradictory contracts, critical nonliteralness, uncovered atoms, semantic or quantitative drift, layer contradiction, accessibility gaps, invented semantics, profile conflicts or cycles, unsupported contexts or validators, exhausted candidates, execution-bound violations, dependency mismatches, or receipt tampering.

There is no generic prose fallback after a hard failure.

## 7. Extension model

A host may add:

- domain terminology and semantic contracts;
- mapped candidate producers outside the trusted core;
- registered deterministic validators in engine code;
- local receipt persistence in the host;
- additional register profiles.

Extensions must be versioned, locally available, deterministic, and bounded. A profile cannot gain access to protected priority tiers or arbitrary execution through declarative data.

## 8. Known limitations

### 8.1 Semantic interpretation

The engine validates registered propositions and candidate-level mappings. It does not possess a general semantic understanding of arbitrary prose. A legitimate paraphrase may fail if it lacks registered match evidence; a misleading sentence may evade a shallow lexical advisory check unless its structured claims expose the problem. Candidate-level atom IDs do not identify exact character spans.

### 8.2 Literary judgment

Subtext, depth, focal integrity, emotional truth, moral adequacy, and motif development cannot be proven by token statistics. Lattice can require structured evidence and issue warnings, but final judgment remains editorial.

### 8.3 Truth and provenance

Hashes establish reproducibility and internal consistency, not source truth, authorship, historical authenticity, or independent verification. Domain claims need separate evidence or attestation.

### 8.4 Accessibility

Channel-independence checks catch registered and known lexical dependencies. They do not replace testing with disabled users, assistive technologies, or the complete interface in which copy appears.

### 8.5 Language coverage

The default normalization, tokenization, sentence splitting, lexical rules, and bundled profile are English-oriented. The context records a locale, but the current engine does not ship independent locale-specific realization resources and rejects non-English safety-critical realization.

### 8.6 Host responsibilities

Lattice emits structured plain text and evidence. The host remains responsible for UI rendering, output escaping, content review, domain source quality, persistence permissions, privacy around supplied content, and presentation-level accessibility.
