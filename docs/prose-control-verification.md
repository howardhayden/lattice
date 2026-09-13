# Prose-control atomization — verification record

Required Notice: Copyright 2026 Hayden Howard. All rights reserved.

Register Material governed by the [Exclusive Register License](../REGISTER-LICENSE.md).

## Scope and baseline

Date: 2026-09-13. Baseline commit: `d6cc85b275e3f14163a5a547f626832fd21b27b0`.

Scope: integrate stronger target-relative control requirements into the existing register atomization. Profile version: `v1.1.0`; rules: 87, comprising the original 69 plus 18 advisory control atoms. No engine source, API, schema, inherited rule, license grant, or historical commit was changed.

The baseline profile, register specification, licensing manifest, and changelog were reconstructed from connector-fetched content and checked against their GitHub blob identities before scoped modifications. The existing profile schema was likewise byte-verified. The preservation test reconstructs the entire original profile from the revised source and requires its exact blob identity, rather than checking selected phrases.

## Executed checks

Command: `node --test test/prose-control.test.mjs` using Node `v22.16.0`.

| Stage | Tests | Passed | Failed | Meaning |
| --- | ---: | ---: | ---: | --- |
| Initial candidate | 34 | 32 | 2 | The affirmative requirements in `RSR-CTL-013` and `RSR-CTL-014` had an inconsistent `avoid` norm. |
| Corrected candidate | 34 | 34 | 0 | Both norms changed to `prefer`; all focused checks passed. |

Preserved failure assertions: `RSR-CTL-013` and `RSR-CTL-014`, expected `prefer`, received `avoid`, message `the norm must agree with the affirmative requirement`. This was a pre-publication correction to the new atoms; no inherited rule or prior published version was rewritten.

Issue → constraint → decision → implementation → failed check → correction → verification:

1. Control vocabulary needed clearer intent, marginal-value, and evidence boundaries.
2. Existing semantic gates, contextual rules, source exclusions, and licensing had to remain intact.
3. Add review atoms rather than invent automatic literary measurements or weaken existing validators.
4. Append `RSR-CTL-001`–`RSR-CTL-018`, document adoption and review mathematics, and keep source/distributed profiles identical.
5. Two affirmative atoms failed the norm-consistency assertion.
6. Correct their norms to `prefer`.
7. Rerun all 34 focused checks successfully; retain the failure and correction here.

Additional executed validation: the complete 87-rule profile passes the repository's unchanged JSON Schema under `jsonschema.Draft202012Validator`. Four hostile variants are rejected: a protected priority, an unregistered validator, an unsupported enforcement value, and an extra automatic-score field. Dependency mutation probes reject missing references and cycles. Reference arithmetic covers accepted-band edges, finite bounds, empty/unknown outcomes, nonfinite values, zero scales, overflow, fixed weights, missing coverage, and cross-tier aggregation rejection.

The test suite also checks source/distributed byte parity, unchanged inherited rules, additive exclusive-license inventory entries, unique IDs, current declarative vocabulary, review-probe coverage, and explicit measurement limitations. Its mathematical functions are test-only reference examples, not shipped scoring APIs. Their output does not certify meaning or reader response.

## Reviewed boundaries and counterexamples

The [atomization](prose-control.md) preserves 54 per-atom positive/negative/boundary editorial probes and six combined probes. These scenarios specify acceptance questions; they are **not executed semantic or human-subject tests**. Review explicitly rejects:

- variance maximization or universal low-complexity targets;
- treating all repetition and affective ornament as waste;
- removing recovery, accessibility restatement, or deferred dependencies for brevity;
- post-hoc target fitting, zero-denominator perfect scores, and unsupported relative-improvement percentages;
- double-counting the same defect or trading away a hard gate;
- converting `manual-review` registration into a passing editorial judgment.

A staged-content scan found no excluded source references in the changed files. The original provenance guard remains unchanged. No new external URLs, network behavior, or executable profile fields were added.

## Coverage limitation

A direct repository clone was unavailable in this runtime; verification used a connector-fetched, byte-checked scoped snapshot. The existing full build/runtime/adversarial suite and complete release-inventory sweep were **not rerun**. Their earlier results are not represented as current results. This record supports the atomization update and its focused checks, not a new full-runtime or release certification. Applicable new manual-review findings remain unknown unless separately assessed through an authorized review process; the current engine has no new input field for supplying those assessments.

## Evidence input bindings

SHA-256 bindings identify the reviewed input bytes. This record does not hash itself or claim external authenticity.

| Input | SHA-256 |
| --- | --- |
| `profiles/relational-systems.profile.json` | `d5145998c2a43f6c1da5e718226dbce38cb81ee2eb3e58feb1fdb07cbf384c11` |
| `docs/prose-control.md` | `8c353a31f09d102394a22c2396222de7cd318f99dd226226d25d41927f41ac73` |
| `test/prose-control.test.mjs` | `e8d92c975865f1e403d57de6fa7e12679be44f9d26e6be509b90be87a768dffd` |
| `schemas/register-profile.schema.json` | `8b56118d939683a034e9796d96bfb98771e432661adfb0eda3e5a59295a46ed1` |
