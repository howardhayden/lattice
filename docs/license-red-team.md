# Licensing adversarial review

Policy revision: 2026-09-23. This review tests the current prospective policy against common evasions and boundary cases. It is engineering evidence, not a legal opinion, ownership verification, or prediction of litigation outcomes.

| ID | Adversarial case | Controlling constraint | Result |
| --- | --- | --- | --- |
| LRE-LRT-001 | A company uses current engine source internally and never redistributes it. | The proprietary engine terms supply no general internal-use or self-hosting grant. An actually offered Official Product may be used only within its entitlement. | Source use blocked absent separate permission; authorized Official Product use remains allowed within scope. |
| LRE-LRT-002 | A person runs the current engine privately with an independently created profile and no commercial purpose. | The proprietary engine terms contain no automatic personal or noncommercial implementation-use exception. | Blocked absent an applicable earlier grant, statutory right, or separate permission. |
| LRE-LRT-003 | An educational, public, nonprofit, or research institution runs current engine source with an independent profile. | Institutional status does not create a current implementation-use exception. | Blocked absent an applicable earlier grant, statutory right, or separate permission. |
| LRE-LRT-004 | A hobbyist runs the exact bundled register for private writing. | Exclusive Register Sections 3 and 4 prohibit functional use by third parties regardless of commercial status. | Blocked. |
| LRE-LRT-005 | A writer reads the atoms and applies them manually without running software. | Functional use expressly includes guiding a human author and manual application. | Blocked. |
| LRE-LRT-006 | A developer copies only selected rules, changes their identifiers, and reorders them. | Register Materials include protectable selection, arrangement, dependencies, and covered derivatives; anti-circumvention terms cover subsets and reordering. | Blocked to the extent protected expression is copied or adapted. |
| LRE-LRT-007 | A model provider uses the register only for retrieval, evaluation, or prompt construction rather than training. | Exclusive Register Section 4 enumerates training, fine-tuning, retrieval, prompting, evaluation, benchmarking, and distillation. | Blocked. |
| LRE-LRT-008 | A consultant gives away register output but charges for surrounding services. | Functional-use and commercial-use definitions cover services, clients, revenue support, and indirect commercial application. | Blocked. |
| LRE-LRT-009 | A recipient redistributes the untouched current owner archive without charge. | The current engine terms supply no general redistribution grant, and register redistribution is separately prohibited regardless of price. | Blocked absent an applicable earlier grant, platform right, statutory right, or separate permission. |
| LRE-LRT-010 | A recipient uses the compiled profile instead of the source JSON. | Mechanically transformed and compiled copies remain Register Materials; source and compiled files are both classified as exclusive. | Blocked. |
| LRE-LRT-011 | A recipient claims that public GitHub visibility implied general implementation permission. | GitHub platform viewing and forking rights are preserved, but publication, possession, interoperability, and source visibility do not create a general off-platform reuse grant. | General implementation reuse remains blocked. |
| LRE-LRT-012 | A recipient independently develops similar ideas without copying protected expression. | The terms do not claim uncopyrightable methods, facts, public-domain material, or independently created expression. | Not restricted by this package’s copyright terms. |
| LRE-LRT-013 | A critic quotes a limited portion under an applicable statutory exception. | Fair use, fair dealing, and other applicable statutory or non-waivable rights are preserved. | Determined by applicable law, not expanded or waived here. |
| LRE-LRT-014 | Someone runs `createEngine()` because the API technically exposes the built-in register. | Technical capability, source access, and example commands are not permission; both current engine use and register functional use require applicable authorization. | Blocked for an unauthorized third party. |
| LRE-LRT-015 | A future maintainer publishes the complete package after changing only `private`. | Closed inventory checks retain proprietary engine files, the exclusive register, current terms, historical notices, and the baseline marker; publication requires separate authorization. | Release gate fails. |
| LRE-LRT-016 | A contributor submits register or engine changes and later disputes ownership. | Contribution policy requires documented ownership and licensing provenance before release; repository access alone is not authorization. | Contribution remains inadmissible until resolved. |
| LRE-LRT-017 | A recipient argues that source visibility or the custom terms make the package “open source.” | The proprietary implementation-reuse limits and register field-of-use restrictions intentionally fail OSI open-source criteria. | Package must be labeled proprietary source-available, not open source. |
| LRE-LRT-018 | The archive is copied despite the licenses. | License text states legal permissions but does not prevent byte copying. Private distribution and access control remain necessary for practical exclusivity. | Residual operational risk disclosed. |

## Preserved pre-baseline findings

The earlier review remains evidence for snapshots to which the earlier terms attached. In particular, its LRE-LRT-002 conclusion permitted qualifying personal engine use under PolyForm, and LRE-LRT-003 permitted qualifying educational or public-institution engine use under PolyForm, each with an independently created profile and subject to those terms. The 2026-09-23 policy does not rewrite those findings or revoke those permissions. The first code-bearing PolyForm snapshot was `7d1d980fa92cf0591dacac06f98391b23e93e9f4`; the last pre-baseline snapshot was `029ca14570b3ebe5703f504ab4b4baed90883f84`.

The earlier engine grant never applied to Register Materials. The register-use, protected-expression, compiled-copy, statutory-rights, independent-creation, visibility, provenance, and practical byte-exposure findings remain substantively applicable under the current split scope.

## Historical correction evidence

The original review produced four release corrections:

1. register-specific requirements were separated from the engine requirements document;
2. the source profile, compiled profile, register-specific examples, specification, and adversarial corpus were assigned to the exclusive scope;
3. quickstart, example, and full verification commands were labeled owner-only because they execute Register Materials; and
4. the package inventory now fails when a file is unclassified, multiply classified, absent, or allowed to escape the exclusive scope.

Those statements describe the earlier release work and are not rewritten as validation of the 2026-09-23 policy.

## 2026-09-23 policy-integration evidence

The prospective policy gate additionally requires:

1. current Engine Materials use `LicenseRef-Hayden-Proprietary-1.1` rather than a fresh PolyForm default;
2. the unchanged custom register scope and all eleven current Register Materials remain closed and exclusive;
3. the retained PolyForm text is classified as historical/administrative evidence rather than current engine terms;
4. the commercial baseline records the exact predecessor and first source-available code commit without inventing an OSI-permissive predecessor; and
5. current docs distinguish Official Product entitlement from source reuse and preserve platform, statutory, historical, and third-party rights.

## Residual boundary

The licenses cannot create copyright in ideas or methods, eliminate statutory exceptions, guarantee enforceability in every jurisdiction, authenticate ownership, or prevent unauthorized copying technically. The policy does not itself set a price, implement billing, publish a release, change repository visibility, or prove user assent. Before public exposure, commercial launch, negotiation, or enforcement, qualified counsel should review ownership, contribution provenance, jurisdiction, customer terms, and distribution controls.
