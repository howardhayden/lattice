# Target-relative prose control — atomization v1.0.0

Required Notice: Copyright 2026 Hayden Howard. All rights reserved.

Register Material governed by the [Exclusive Register License](../REGISTER-LICENSE.md).

## Authority, scope, and adoption

The normative atoms are `RSR-CTL-001`–`RSR-CTL-018` in the [bundled profile](../profiles/relational-systems.profile.json), version `v1.1.0`. This document supplies their review semantics, not a competing executable rule set. The [product requirements](requirements.md), protected priorities, and original register rules remain in force. No existing atom is superseded.

Source of this change: owner-authorized target-relative control requirements, adopted on 2026-09-13. Baseline: commit `d6cc85b275e3f14163a5a547f626832fd21b27b0`, profile blob `5480c377dbcf546df99f1ba819c48083dbf35937`. Ownership: register maintainer for requirements; reviewing editor for evidence; host integrator for any future measurement implementation. This provenance deliberately records the authorized technical requirements rather than examples used to discuss them.

**Definition.** Prose control is the degree to which a particular realization preserves its warranted intended effects and avoids attributable unintended effects for a declared task, audience, and context. Control is not overall quality, distinctiveness, smoothness, brevity, low complexity, or maximum sentence-length variance. A disorienting passage may be controlled; disorientation does not excuse an unclear required action.

This is an atomization update, not an automatic literary-scoring feature. All added rules are advisory and use the existing `manual-review` validator. Applicable unassessed rules remain **unknown**. Editorial annotations are external review evidence, not newly supported request fields or a way to inject a passing engine finding.

## Stronger-only integration

| Existing authority retained | Narrow addition | New atoms |
| --- | --- | --- |
| `RSR-CORE-002`, `RSR-CORE-003`: contextual register, no feature quotas | Distinguish control from generic polish; pin purpose and targets before comparison | `RSR-CTL-001`, `RSR-CTL-002` |
| `LRE-SEM-009`–`LRE-SEM-016`: protected meaning and dependencies | Review unintended implications beyond mechanically registered coverage; separate causal warrant from deliberate association | `RSR-CTL-003`, `RSR-CTL-004` |
| `RSR-FLOW-001`–`RSR-FLOW-006`, `RSR-DEP-002`: embodied causal movement | Review the warrant for each abstraction transition without imposing a universal sequence | `RSR-CTL-005` |
| `RSR-RHY-001`–`RSR-RHY-003`: contextual cadence | Assess the purpose of rhythmic variation, not variance alone | `RSR-CTL-006` |
| `RSR-EMB-004`, `RSR-EXC-004`: nonredundant imagery | Count affective, rhythmic, and relational contribution, not only new propositions | `RSR-CTL-007` |
| `RSR-SUB-004`, `RSR-DEP-004`, `RSR-EXC-006`: inferable subtext and protected action | Distinguish warranted interpretive openness from accidental confusion | `RSR-CTL-008` |
| `RSR-CORE-001`, `RSR-SUB-002`, `RSR-DEP-003`: remove redundant interpretation | Counterfactual review with explicit accessibility, orientation, emphasis, and deferred-payoff exceptions | `RSR-CTL-009` |
| `RSR-EXP-002`, `RSR-DEP-002`: task-relevant exposition | Audience-relative load at paragraph and cross-paragraph scales, without universal capacity claims | `RSR-CTL-010` |
| `RSR-RHY-003`: contextual compression and attention | Local emphasis allocation and justified sustained intensity | `RSR-CTL-011` |
| `RSR-SCN-003`, `RSR-SCN-004`: earned closure | Stopping-point review at sentence, paragraph, section, and whole-text scales | `RSR-CTL-012` |
| `LRE-LIM-003`, `LRE-LIM-004`, `LRE-EVI-006`: bounded evidence authority | Undefined-case handling; annotation/measurement distinction; matched comparisons and materiality | `RSR-CTL-013`–`RSR-CTL-015` |
| `LRE-VAL-001`–`LRE-VAL-007`, `LRE-RNK-001`–`LRE-RNK-003`: hard gates and lexicographic ranking | Within-tier review aggregation without double counting; feasible, interaction-aware ablation | `RSR-CTL-016`–`RSR-CTL-018` |

Descriptions in this table explain the extension; the cited original rules remain authoritative in their own scope. A style review cannot relabel a hard failure as acceptable intentional variance. Existing advisory cadence and redundancy detectors retain their findings, but those proxy findings do not settle an editorial control judgment.

## Mathematical review model

### 1. Context, units, and targets

Let `k` denote purpose, audience knowledge and attention, genre, layer, surface, stakes, and available channels. Let `u` be a declared sentence, paragraph, section, or whole-text unit. The author or reviewer records a target specification before comparing candidate realizations:

\[
T_{u,k}=(I_{u,k},F_{u,k},A_{u,k},V).
\]

`I` contains required effects; `F` contains prohibited effects; `A` contains acceptable ranges or alternatives, including deliberately unresolved interpretations; `V` identifies the target revision and its provenance. An editorial target is not an assertion that its effect occurred. A target revision requires a recorded reason and reassessment of all compared candidates; it must not retroactively certify a preferred result.

The review dimensions are semantic precision, causal warrant, abstraction timing, cadence purpose, expressive-device contribution, ambiguity, redundancy, processing load, emphasis, and exit timing. These are separable questions, not assumed independent or naturally numerical quantities. Unit boundaries and surrounding context must be pinned: shortening the scoring window to hide repetition or a missing later payoff is not a valid improvement.

### 2. Hard admissibility remains prior to style

For applicable hard requirements `H(k)`:

\[
\mathcal F_k=\{x:\forall h\in H(k),\ h(x)=\mathrm{pass}\}.
\]

Failure or unknown at an applicable hard gate excludes the candidate. If this set is empty, the existing typed-failure behavior applies; no control score repairs it. Safety, semantic fidelity, accessibility equivalence, required operative clarity, and authoritative domain correctness retain their existing precedence. Editorial targets cannot downgrade those obligations.

### 3. Optional bounded loss, not an intrinsic writing score

Only where a documented rubric supplies a meaningful dimension-specific scale, let `y` be an assessed outcome, `A` a nonempty acceptable target set, `d` its declared distance function, and `s > 0` its declared scale:

\[
\ell_{u,d}=\min\left(1,\frac{\inf_{a\in A_{u,d}}d_d(y_{u,d},a)}{s_d}\right).
\]

The distance must be nonnegative and finite. An outcome inside its accepted target set has zero loss. An absent assessment, unsupported distance scale, empty target, nonfinite value, or nonpositive scale yields **unknown**, not zero loss. A genuinely absent opportunity is **not applicable**, with a reason. Neither status is silently converted to a number. Empty prose is not perfect prose; it may separately fail semantic coverage.

For a numeric interval `[a,b]`, one possible distance is `max(a-y, 0, y-b)` where `a <= b`. This is a reference arithmetic example, not a method for inferring literary effects. Most editorial judgments should remain categorical unless a scale is justified.

A unit therefore has a loss **vector** and an evidence record. It does not automatically receive one universal score. A bounded transformation `1 - loss` is merely a rubric-dependent convenience, not a calibrated probability, reader-success rate, or quantity of writer ability.

### 4. Aggregation, coverage, and comparison

If all required assessments in a nonempty, fixed comparison set within one priority tier are available and comparable, an optional review summary is:

\[
L_t=\sum_{(u,d)\in J_t}w_{u,d}\ell_{u,d},\qquad
w_{u,d}\ge0,\quad \sum_{J_t}w_{u,d}=1.
\]

Weights, units, and targets are fixed before comparison. An unknown assessment makes this summary unknown; do not renormalize weights to hide missing evidence. Report coverage separately. With no applicable units, coverage is not applicable. Each evidenced defect receives one primary loss assignment; cross-references may explain its consequences but may not charge it again as an extra penalty.

No sum crosses protected priorities. The engine's lexicographic ranking remains unchanged. These optional review summaries are not inputs to, or replacements for, the current ranking implementation.

A conservative editorial comparison can report that candidate `b` dominates `a` on a matched assessed set `J` when:

\[
\ell_j(b)\le\ell_j(a)\quad\forall j\in J,
\qquad\ell_j(b)<\ell_j(a)\quad\text{for some }j.
\]

This is a sufficient comparison rule, not a total ordering of literature. Cross-dimensional tradeoffs should be exposed. Calling an improvement *considerable* additionally requires a predeclared materiality criterion, adequate matched samples, and reported uncertainty. A hand-assigned score difference or a percentage computed from an arbitrary scale does not establish a measured gain. Statistical significance and editorial materiality are different questions. The model makes no population ranking claim.

### 5. Marginal contribution and stopping

Let `x \\ B` denote a version with an element or interacting bundle `B` removed or simplified. Compare it with `x` only when both retain all applicable hard requirements. Under an explicitly declared utility rubric, the conceptual marginal contribution is:

\[
\Delta U(B\mid x,k)=U(x,k)-U(x\setminus B,k).
\]

Without a justified utility scale, record categorical evidence instead of numbers. Contribution may be semantic, affective, perceptual, rhythmic, relational, orienting, or deferred. A sentence need not introduce a new fact to matter. Required warnings and accessibility restatement are not decorative overhead.

A noncontributing addition is a candidate for removal, not an automatic deletion instruction. Check whole-text dependencies and interactions before deciding. Removing one element from a mutually supporting pair can misattribute the pair's value; test the bundle as well. Review stopping points only after required meaning, recovery, orientation, and earned future dependencies are preserved. There is no universally optimal stopping threshold or proof of global optimality from a greedy local deletion.

Effect-per-word, useful-device/total-device, and intentional-ambiguity/total-ambiguity ratios are not default objectives. They have zero-denominator, attribution, and compression-gaming problems. Processing-load counts and contextual emphasis differences may support review, but are not universal cognitive-capacity or reader-impact equations. Deliberate difficulty, repetition, silence, and sustained intensity remain permitted where warranted and compatible with higher obligations.

## Atomic acceptance register

Every row inherits owner authorization, baseline provenance, fixed precedence, and the evidence limits above. Runtime dependencies are exactly those in the profile: `001` depends on `RSR-CORE-002`; `002` depends on `001`; `003`–`018` depend on `002`. The earlier-rule links in the adoption table are semantic lineage, not additional runtime dependencies that could inadvertently suppress an otherwise applicable control.

All rows have status **atomized; advisory/manual review; automated literary evaluation not implemented**. `P`, `N`, and `B` suffixes identify positive, negative, and boundary review probes. These are acceptance scenarios, not claims of executed human-subject tests.

| Atom / review owner | Applicability and independent acceptance | Positive probe | Negative probe | Boundary probe |
| --- | --- | --- | --- | --- |
| `RSR-CTL-001` / editor | All layers; distinguish intended-effect fidelity from polish | `CTL-001-P`: a deliberately jagged passage preserves its declared effects | `CTL-001-N`: fluency alone is called control | `CTL-001-B`: equally controlled candidates differ in distinctiveness |
| `RSR-CTL-002` / editor | All layers; record target, context, unit, provenance, revision before comparing | `CTL-002-P`: both candidates use a pinned target | `CTL-002-N`: targets are changed only for the favored candidate | `CTL-002-B`: an authorized purpose change triggers reevaluation of both |
| `RSR-CTL-003` / editor | All layers; identify attributable unintended implications with evidence | `CTL-003-P`: a modal strengthening is identified by its span | `CTL-003-N`: covered keywords excuse an added guarantee | `CTL-003-B`: uncertain implicature is labeled uncertain, not a fact |
| `RSR-CTL-004` / editor | Experiential/interpretive; preserve relation status | `CTL-004-P`: a hypothesis remains conditional | `CTL-004-N`: a shared date is rewritten as causation | `CTL-004-B`: deliberate association remains association |
| `RSR-CTL-005` / editor | Experiential/interpretive; justify abstraction timing | `CTL-005-P`: a concrete constraint supports a generalization | `CTL-005-N`: detachable theory displaces the present choice | `CTL-005-B`: a formal proof needs no invented sensory anchor |
| `RSR-CTL-006` / editor | Experiential/interpretive; ornament-tagged; align cadence with effect | `CTL-006-P`: a pause serves a declared change in pressure | `CTL-006-N`: random sentence splitting raises variance only | `CTL-006-B`: uniform cadence deliberately sustains monotony |
| `RSR-CTL-007` / editor | Experiential/interpretive; ornament-tagged; evaluate marginal device value | `CTL-007-P`: an image changes felt distance without adding a fact | `CTL-007-N`: a second image duplicates the first without another function | `CTL-007-B`: a device matters only as part of a later motif |
| `RSR-CTL-008` / editor | Experiential/interpretive; subtext-tagged; distinguish openness from confusion | `CTL-008-P`: two supported motives remain unresolved | `CTL-008-N`: an unidentified actor makes a required action unclear | `CTL-008-B`: meaning is explicit in the accessibility equivalent |
| `RSR-CTL-009` / editor | All layers; assess counterfactual contribution of repetition | `CTL-009-P`: an unsupported explanatory echo is removed | `CTL-009-N`: a necessary recap is deleted for lexical overlap | `CTL-009-B`: a refrain earns its place through rhythm rather than novelty |
| `RSR-CTL-010` / editor | All layers; relate load to audience and adjacent paragraphs | `CTL-010-P`: a new term receives enough orientation | `CTL-010-N`: short sentences hide an unexplained chain of concepts | `CTL-010-B`: expert shorthand remains valid for a declared expert audience |
| `RSR-CTL-011` / editor | Experiential/interpretive; ornament-tagged; assess contextual emphasis | `CTL-011-P`: a consequential turn has supported contrast | `CTL-011-N`: every sentence competes as a climax without purpose | `CTL-011-B`: sustained intensity is an explicit warranted target |
| `RSR-CTL-012` / editor | All layers; review multiscale exits without dropping obligations | `CTL-012-P`: an afterword repeating settled meaning is removed | `CTL-012-N`: a required recovery step is cut for a sharper ending | `CTL-012-B`: later evidence genuinely revises the apparent ending |
| `RSR-CTL-013` / reviewer | All layers; keep unknown distinct from not applicable | `CTL-013-P`: missing assessment remains unknown | `CTL-013-N`: zero devices produces a perfect ratio | `CTL-013-B`: no applicable opportunity is not applicable with a reason |
| `RSR-CTL-014` / reviewer | All layers; label the authority of each value | `CTL-014-P`: an ordinal judgment is labeled editorial | `CTL-014-N`: a rubric value is called a reader-success probability | `CTL-014-B`: a measured word count remains only a word count |
| `RSR-CTL-015` / reviewer | All layers; require matched comparison and declared materiality | `CTL-015-P`: matched units share a target and rubric | `CTL-015-N`: different genres are ranked on unlike scales | `CTL-015-B`: one passage supports only a passage-level judgment |
| `RSR-CTL-016` / reviewer | All layers; preserve tiers, coverage, and single defect accounting | `CTL-016-P`: a defect has one primary loss assignment | `CTL-016-N`: its loss is charged again as a penalty | `CTL-016-B`: missing evidence prevents a complete aggregate |
| `RSR-CTL-017` / editor | All layers; constrain ablation to admissible meaning-preserving alternatives | `CTL-017-P`: simplification retains all obligations and effects | `CTL-017-N`: a brevity win excuses a semantic failure | `CTL-017-B`: the longer candidate is clearer and equally controlled |
| `RSR-CTL-018` / editor | All layers; check interacting and deferred contribution | `CTL-018-P`: an image pair is reviewed together | `CTL-018-N`: a later dependency is lost through greedy local deletion | `CTL-018-B`: individually redundant cues jointly orient the reader |

## Evidence and red-team boundaries

An editorial review record identifies the atom ID and revision, profile version and digest, candidate and target identities, unit/span boundaries, context, applicability, finding (`supported`, `violated`, `unknown`, or `not applicable`), evidence, reviewer, and any correction/recheck. Freeze the record's reviewed dependencies. A receipt proves reproducible handling of registered material, not a reader's experience or the truth of a target annotation.

Combined review probes:

- `CTL-C-001`: expressive ambiguity plus an accessibility equivalent. Preserve the expressive option without transferring essential meaning into implication.
- `CTL-C-002`: brevity plus a required recovery step. The hard obligation wins before marginal-value review.
- `CTL-C-003`: high local cadence variance plus no warranted effect. Do not treat a passed proxy as semantic evidence.
- `CTL-C-004`: low paragraph load plus a missing cross-paragraph dependency. Inspect the larger unit.
- `CTL-C-005`: a strong device pair plus individually weak contributions. Evaluate the bundle rather than deleting both greedily.
- `CTL-C-006`: unknown outcomes plus favorable known outcomes. Preserve unknown coverage; do not manufacture a complete score.

Mechanical checks can establish profile parity, stable IDs, unchanged inherited rules, valid references, bounded declarative shapes, version changes, and arithmetic edge handling. They cannot establish the success of those editorial scenarios. Implementation or stronger completion claims require their own evidence and cannot be inferred from registration alone.
