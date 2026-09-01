# Licensing adversarial review

This review tests the intended policy against common evasions and boundary cases. It is engineering evidence, not a legal opinion or a prediction of litigation outcomes.

| ID | Adversarial case | Controlling constraint | Result |
| --- | --- | --- | --- |
| LRE-LRT-001 | A company uses only the engine internally and never redistributes it. | PolyForm permits only its defined noncommercial purposes; anticipated commercial application and internal commercial use are outside the grant. | Blocked. |
| LRE-LRT-002 | A person uses the engine privately with an independently created profile and no anticipated commercial application. | PolyForm Personal Uses. | Permitted under the engine scope. |
| LRE-LRT-003 | A qualifying educational or public institution uses only the engine with an independently created profile. | PolyForm Noncommercial Organizations. | Permitted under the engine scope, subject to its terms. |
| LRE-LRT-004 | A hobbyist runs the exact bundled register for private writing. | Exclusive Register Sections 3 and 4 prohibit functional use by third parties regardless of commercial status. | Blocked. |
| LRE-LRT-005 | A writer reads the atoms and applies them manually without running software. | Functional use expressly includes guiding a human author and manual application. | Blocked. |
| LRE-LRT-006 | A developer copies only selected rules, changes their identifiers, and reorders them. | Register Materials include protectable selection, arrangement, dependencies, and covered derivatives; anti-circumvention terms cover subsets and reordering. | Blocked to the extent protected expression is copied or adapted. |
| LRE-LRT-007 | A model provider uses the register only for retrieval, evaluation, or prompt construction rather than training. | Section 4 enumerates training, fine-tuning, retrieval, prompting, evaluation, benchmarking, and distillation. | Blocked. |
| LRE-LRT-008 | A consultant gives away register output but charges for surrounding services. | Functional use and commercial-use definitions cover services, clients, revenue support, and indirect commercial application. | Blocked. |
| LRE-LRT-009 | A recipient redistributes the untouched owner archive without charge. | Register redistribution is prohibited regardless of price; PolyForm cannot override the exclusive scope. | Blocked. |
| LRE-LRT-010 | A recipient uses the compiled profile instead of the source JSON. | Mechanically transformed and compiled copies remain Register Materials; source and compiled files are both classified as exclusive. | Blocked. |
| LRE-LRT-011 | A recipient claims that public visibility implied permission. | Publication, possession, interoperability, and source visibility are expressly rejected as implied grants. | Blocked. |
| LRE-LRT-012 | A recipient independently develops similar ideas without copying protected expression. | The terms do not claim uncopyrightable methods, facts, or independently created material. | Not restricted by this package’s copyright terms. |
| LRE-LRT-013 | A critic quotes a limited portion under an applicable statutory exception. | Fair use, fair dealing, and other non-waivable statutory rights are preserved. | Determined by applicable law, not expanded or waived here. |
| LRE-LRT-014 | Someone runs `createEngine()` because the API technically exposes the built-in register. | Technical capability is not permission; the owner package’s quickstart and verification commands are labeled owner-only. | Blocked for third parties. |
| LRE-LRT-015 | A future maintainer publishes the complete package after changing only `private`. | Closed inventory checks still classify the profile, fixtures, tests, and specification as exclusive; release requirements require a distinct engine-only extraction. | Release gate fails. |
| LRE-LRT-016 | A contributor submits register changes and later disputes ownership. | Contribution policy requires documented ownership and licensing provenance before release. | Contribution remains inadmissible until resolved. |
| LRE-LRT-017 | A recipient argues the custom terms make the package “open source.” | Commercial and field-of-use restrictions intentionally fail the Open Source Definition. | Package must be labeled source-available, not open source. |
| LRE-LRT-018 | The archive is copied despite the license. | A license states legal permissions but does not prevent byte copying. Private distribution and access control remain necessary for practical exclusivity. | Residual operational risk disclosed. |

## Correction evidence

The review produced four release corrections:

1. register-specific requirements were separated from the engine requirements document;
2. the source profile, compiled profile, register-specific examples, specification, and adversarial corpus were assigned to the exclusive scope;
3. quickstart, example, and full verification commands were labeled owner-only because they execute Register Materials; and
4. the package inventory now fails when a file is unclassified, multiply classified, absent, or allowed to escape the exclusive scope.

## Residual boundary

The license cannot create copyright in ideas or methods, eliminate statutory exceptions, guarantee enforceability in every jurisdiction, or prevent unauthorized copying technically. Before public exposure, commercial negotiation, or enforcement, qualified counsel should review ownership, contribution provenance, jurisdiction, and distribution controls.
