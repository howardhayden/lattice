# Lattice atomic requirements register

## 1. Authority and conformance

This register is the normative product specification for Lattice. Requirements are independently testable and use stable identifiers. Architecture prose and examples explain these requirements but do not override them.

Implementation status must be established by preserved test and review evidence. The presence of a requirement, type, file, or derivation receipt does not by itself establish implementation or verification.

Priority is fixed:

```text
safety
> semantic fidelity
> accessibility equivalence
> operative clarity
> domain correctness
> register fit
> ornament
```

## 2. Scope

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-SCP-001 | The engine MUST realize copy from typed meaning contracts and mapped candidates or controlled literal forms. | Render a valid contract and inspect atom-to-output mappings. |
| LRE-SCP-002 | The engine MUST NOT claim strong semantic preservation for arbitrary unstructured rewriting. | Audit public API, documentation, and free-form lint output. |
| LRE-SCP-003 | Free-form text linting MUST be labeled advisory. | Verify lint result authority and documentation. |
| LRE-SCP-004 | The core MUST emit structured plain text separately from host presentation. | Reject executable markup and inspect output model. |
| LRE-SCP-005 | The bundled profile MUST be titled `Relational Systems Register`. | Inspect compiled profile identity and public documentation. |

## 3. Determinism and locality

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-DET-001 | Identical canonical inputs and versioned dependencies MUST produce byte-identical outputs. | Replay the same fixture across fresh processes. |
| LRE-DET-002 | Identical canonical inputs and versioned dependencies MUST produce the same derivation digest. | Compare independent replay receipts. |
| LRE-DET-003 | The core MUST NOT use ambient randomness. | Static scan and deterministic replay test. |
| LRE-DET-004 | The core MUST NOT use implicit clock time in realization or ranking. | Static scan and fake-clock replay test. |
| LRE-DET-005 | The core MUST NOT depend on filesystem enumeration order, process order, or host locale. | Shuffle candidate and file order under a pinned locale. |
| LRE-DET-006 | Runtime realization MUST make no network calls. | Static scan and run with network unavailable. |
| LRE-DET-007 | Runtime realization MUST emit no telemetry. | Static scan and monitored execution. |
| LRE-DET-008 | Profile data MUST NOT dynamically load or execute code. | Attempt executable profile payloads and expect rejection. |
| LRE-DET-009 | The engine MUST NOT persist source text or receipts implicitly. | Render without host persistence and verify no files are written. |

## 4. Semantic contracts

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-SEM-001 | Every semantic atom MUST have a unique stable identifier. | Duplicate-ID negative test. |
| LRE-SEM-002 | Every atom MUST declare a supported kind, frame, polarity, modality, criticality, and required layers. | Omit each field in isolation. |
| LRE-SEM-003 | Safety and operative atoms MUST include a controlled literal form. | Missing-literal negative test. |
| LRE-SEM-004 | Safety and operative atoms MUST be required in the operative layer. | Invalid-layer negative test. |
| LRE-SEM-005 | Safety atoms MUST use explicit delivery in operative output. | Invalid-delivery negative test. |
| LRE-SEM-006 | Every atom required in safety-critical operative output MUST have an explicit controlled literal form. | Critical-context contract negative test. |
| LRE-SEM-007 | Profiles MUST NOT set or downgrade atom criticality. | Malicious profile compilation test. |
| LRE-SEM-008 | Profiles MUST NOT set or downgrade context stakes or safety class. | Malicious profile compilation test. |
| LRE-SEM-009 | Protected actors, polarity, modality, quantities, units, timing, directions, conditions, consequences, and recovery MUST survive realization unchanged. | One mutation test per protected field. |
| LRE-SEM-010 | Every required atom MUST map to the selected output candidate. | Remove one mapping and expect hard failure. |
| LRE-SEM-011 | An atom mapping MUST NOT count as coverage unless the candidate text also contains registered realization evidence. | Supply an ID without matching text and expect failure. |
| LRE-SEM-012 | Every selected-output sentence MUST carry registered lexical evidence from a mapped atom or a registered non-verified claim. | Append an unsupported sentence and expect failure. |
| LRE-SEM-013 | Prohibited claims MUST fail semantic validation. | Add each prohibited claim to a candidate. |
| LRE-SEM-014 | Protected before/after relations MUST retain valid order, and required dependencies MUST be delivered in every dependent layer. | Reverse an ordered pair or omit a dependency and expect failure. |
| LRE-SEM-015 | Contradictory atoms MUST fail contract validation. | Submit equivalent frames with opposing protected meaning. |
| LRE-SEM-016 | Protected dependency cycles MUST fail contract validation. | Submit a cyclic ordering fixture. |

## 5. Layers and accessibility

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-LAY-001 | The engine MUST distinguish operative, experiential, and interpretive content layers. | Schema and output validation. |
| LRE-LAY-002 | The engine MUST distinguish standard and accessibility-equivalent representations. | Schema and output validation. |
| LRE-LAY-003 | All requested outputs MUST derive from one validated contract and normalized output plan. | Compare contract and output provenance across results. |
| LRE-LAY-004 | Experiential copy MUST fail when it contains a registered prohibited claim or a detected inversion of a controlled safety prohibition. | Cross-layer contradiction fixtures. |
| LRE-LAY-005 | Interpretive copy MUST fail when it contains a registered prohibited claim or a detected inversion of a controlled safety prohibition. | Cross-layer contradiction fixtures. |
| LRE-LAY-006 | An accessibility equivalent MUST cover the same relevant atoms and consequences as its standard counterpart. | Bidirectional atom-set comparison. |
| LRE-LAY-007 | Accessibility-equivalent meaning MUST NOT depend uniquely on imagery. | Imagery-only negative fixture. |
| LRE-LAY-008 | Accessibility-equivalent meaning MUST NOT depend uniquely on color. | Color-only negative fixture. |
| LRE-LAY-009 | Accessibility-equivalent meaning MUST NOT depend uniquely on sound. | Sound-only negative fixture. |
| LRE-LAY-010 | Accessibility-equivalent meaning MUST NOT depend uniquely on spatial inference. | Spatial-only negative fixture. |
| LRE-LAY-011 | Accessibility-equivalent meaning MUST NOT depend uniquely on timing perception or implication. | Timing- and implication-only negative fixtures. |
| LRE-LAY-012 | Safety-critical requests MUST include standard and accessibility-equivalent operative outputs. | Omit them from a request and verify normalized inclusion or typed failure. |

## 6. Profiles and rule resolution

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-PRO-001 | Profiles MUST be bounded declarative data. | Reject functions, non-finite values, prohibited keys, and excessive nesting. |
| LRE-PRO-002 | Profiles MUST use stable unique rule identifiers and revisions. | Duplicate and missing identifier tests. |
| LRE-PRO-003 | Profile rule predicates MUST use only allowlisted operations and fields. | Unknown operator and field tests. |
| LRE-PRO-004 | Predicate depth and node count MUST be bounded. | Boundary and overflow tests. |
| LRE-PRO-005 | Validators MUST come from a closed registry. | Unknown validator ID tests. |
| LRE-PRO-006 | Profile data MUST NOT contain or invoke text transforms, arbitrary regular expressions, evaluation, or executable code. | Static scan and hostile-profile tests. |
| LRE-PRO-007 | Profile dependency cycles MUST invalidate compilation. | Cyclic dependency fixture. |
| LRE-PRO-008 | Unresolved dependencies and conflicts MUST invalidate compilation. | Missing-reference fixtures. |
| LRE-PRO-009 | Same-tier hard requirement/prohibition conflicts MUST invalidate profile composition. | Compose opposing rules and expect failure. |
| LRE-PRO-010 | Rule resolution MUST record applicability separately from validation outcome. | Inspect decision and finding records. |
| LRE-PRO-011 | Every suppression MUST include a reason code and any precedence winner where one exists. | Protected-context suppression test. |
| LRE-PRO-012 | Profiles MUST NOT define or supersede protected safety, semantic, or accessibility priorities. | Protected-tier negative test. |
| LRE-PRO-013 | Compiled profiles MUST be immutable and content-addressed. | Mutation attempt and digest replay. |

## 7. Hard gates and ranking

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-VAL-001 | Safety validation MUST be a non-tradeable hard gate. | High-style unsafe candidate must lose. |
| LRE-VAL-002 | Semantic validation MUST be a non-tradeable hard gate. | High-style incomplete candidate must lose. |
| LRE-VAL-003 | Accessibility equivalence MUST be a non-tradeable hard gate when requested or required. | High-style inaccessible candidate must lose. |
| LRE-VAL-004 | Operative clarity MUST be a hard gate where action, contact, timing, safety, or recovery requires it. | Ambiguous operative candidate must fail. |
| LRE-VAL-005 | Authoritative domain correctness MUST be a hard gate when the contract marks it authoritative. | Unsupported authoritative claim must fail. |
| LRE-VAL-006 | Unknown results at a hard tier MUST fail rather than pass. | Remove a required validator and expect failure. |
| LRE-VAL-007 | Candidates failing any applicable hard gate MUST be excluded before ranking. | Inspect candidate rejection evidence. |
| LRE-RNK-001 | Remaining candidates MUST be ranked lexicographically by priority tier. | Construct cross-tier score inversion fixture. |
| LRE-RNK-002 | Weights MUST compare candidates only within one tier. | Oversized low-tier weight negative test. |
| LRE-RNK-003 | Complete ties MUST resolve by stable candidate identifier or canonical digest. | Reverse input order and compare selection. |
| LRE-RNK-004 | A literal baseline MUST pass every applicable hard gate before selection. | Unsafe baseline negative test. |
| LRE-RNK-005 | Suppression of an applicable soft profile rule MUST produce an explicit degraded or nonconformant profile state. | Protected-context baseline test. |
| LRE-RNK-006 | Exhaustion of all valid candidates MUST return a typed failure. | Reject all candidates and inspect failure code. |

## 8. Restricted register boundary

The bundled register’s integration requirements are maintained in the [restricted register specification](register-specification.md). That document, the atomized profile, its compiled form, register-specific fixtures, and the designated adversarial corpus are Register Materials governed by the Exclusive Register License. They do not inherit the engine’s PolyForm grant.

## 9. Evidence and replay

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-EVI-001 | Every successful realization MUST return a derivation receipt. | Render a valid request and inspect the result. |
| LRE-EVI-002 | The receipt MUST bind the canonical normalized request, outputs, engine version, and selected profile versions and digests. | Mutate each bound dependency and expect digest mismatch. |
| LRE-EVI-003 | The receipt MUST include candidate-addressable rule dispositions for every evaluated candidate. | Compare candidates and compiled rules with decision entries. |
| LRE-EVI-004 | The receipt MUST include each candidate digest, selection state, rank where scored, and rejection codes. | Multi-candidate fixture. |
| LRE-EVI-005 | The result MUST expose hard and advisory findings for each selected output. | Inspect hard and advisory findings. |
| LRE-EVI-006 | The receipt trust scope MUST be limited to reproducibility and conformance. | Schema and value assertion. |
| LRE-EVI-007 | Receipt verification MUST recompute the receipt derivation digest. | Tamper with each receipt field. |
| LRE-EVI-008 | Result verification MUST bind every returned output field and independently derive aggregate conformance. | Tamper with output evidence or top-level conformance. |
| LRE-EVI-013 | Receipt verification MUST enforce closed fields, unique output and candidate records, exactly one admissible selection per output, and valid decision references. | Rehash structurally impossible receipt fixtures. |
| LRE-EVI-009 | Full semantic replay MUST require the original request and matching engine and profile versions rather than trusting receipt assertions. | Submit a fabricated but internally coherent receipt and attempt semantic replay. |
| LRE-EVI-010 | Evidence MUST distinguish internal consistency from external anchoring. | Review assurance fields and unanchored fixtures. |
| LRE-EVI-011 | A regenerated self-consistent local history MUST NOT be labeled authentic. | Replace a locally retained history without an independent anchor. |
| LRE-EVI-012 | Observational timestamps, if added by a host, MUST NOT affect deterministic derivation. | Compare otherwise identical host records. |

## 10. Bounds, safety, and input handling

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-BND-001 | Input characters, output characters, atoms, relations, candidates, active rules, receipt decisions, predicate depth, predicate nodes, identifiers, and declarative arrays MUST be bounded. | Positive boundary and over-bound tests. |
| LRE-BND-002 | Candidate enumeration and transformation passes MUST be bounded. | Candidate-explosion fixture. |
| LRE-BND-003 | Inputs MUST reject prohibited control characters and normalize allowed Unicode consistently. | Unicode boundary fixtures. |
| LRE-BND-004 | Identifiers MUST reject confusable or noncanonical alternatives outside the identifier policy. | NFKC and unsupported-character tests. |
| LRE-BND-005 | Declarative data MUST reject prototype-pollution keys and non-plain objects. | Hostile object fixtures. |
| LRE-BND-006 | Core output MUST reject executable or presentation markup. | Markup-like candidate fixtures. |
| LRE-BND-007 | Failure responses MUST use stable typed codes without leaking unrelated local data. | Snapshot representative failures. |

## 11. Honest limitations

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-LIM-001 | Public documentation MUST distinguish registered semantic coverage from general language understanding. | Documentation review. |
| LRE-LIM-002 | Public documentation MUST distinguish internal consistency from factual truth and authenticity. | Documentation review. |
| LRE-LIM-003 | Advisory validators MUST NOT independently certify a hard invariant. | Authority inversion negative test. |
| LRE-LIM-004 | A low-confidence or unsupported advisory evaluation MUST report unknown or not evaluated, not pass. | Manual-review fixture. |
| LRE-LIM-005 | Accessibility checks MUST NOT be represented as a substitute for user and assistive-technology testing. | Documentation and UI-copy review. |
| LRE-LIM-006 | Language-specific behavior MUST identify its current locale limitations. | Dependency and documentation review. |
| LRE-LIM-007 | Host applications MUST remain responsible for presentation, escaping at render boundaries, source quality, privacy, and persistence permissions. | Integration documentation review. |

## 12. Release gate

A release is conformant only when:

1. every applicable hard requirement passes;
2. no hard evaluation is unknown or silently suppressed;
3. all selected and accessibility-equivalent outputs have complete candidate-level atom and source mappings;
4. deterministic replay passes from a clean process;
5. positive, negative, boundary, combination, correction, and replay evidence is preserved;
6. unresolved advisory findings are disclosed rather than converted into passes;
7. documentation matches the shipped schema and public API;
8. known failures and corrections remain traceable through issue, constraint, decision, implementation, failed test, correction, and verification.

Licensing completeness is a separate hard release gate defined by [Lattice atomic licensing requirements](license-requirements.md). Product conformance does not imply permission to distribute or use the package.
