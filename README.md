# Lattice — Layered Register Engine

Lattice is a local-first, deterministic TypeScript engine for producing and validating context-sensitive copy from typed meaning contracts. It separates **what a text must mean** from **how that meaning may be expressed**, then records how each output was derived.

This owner package is **proprietary source-available software, not open source**. Engine files are available only under PolyForm Noncommercial 1.0.0. The bundled register is separately reserved for Hayden Howard’s exclusive functional use; third parties receive inspection permission but no right to execute, apply, adapt, redistribute, train on, or commercialize it. See [Licensing](#licensing).

Lattice is not an arbitrary prose-rewriting system. It does not infer an authoritative semantic contract from unstructured text, call a language model, or treat stylistic resemblance as proof that meaning survived. Strong guarantees apply only when a caller supplies structured semantic atoms, explicit context, compiled register rules, and traceable candidate realizations.

The package includes the **Relational Systems Register**, a profile for prose that connects embodied experience, relationships, institutions, causality, and consequence while resisting redundant explanation and decorative density.

## What Lattice provides

- Isolated, validated meaning contracts composed of independently addressable semantic atoms.
- Separate operative, experiential, and interpretive content layers.
- Standard and accessibility-equivalent representations of each layer.
- Declarative, bounded register profiles with stable rule identifiers.
- A fixed priority order that style cannot override.
- Deterministic candidate validation and lexicographic selection, with an explicitly labeled literal baseline when no candidate is supplied.
- Traceable rule decisions, atom coverage, validation findings, and derivation digests.
- Local execution without runtime AI, network calls, telemetry, or hidden external state.
- Advisory linting for existing free-form text.

## Non-negotiable priority

Lattice resolves constraints in this order:

```text
safety
> semantic fidelity
> accessibility equivalence
> operative clarity
> domain correctness
> register fit
> ornament
```

Safety, semantic fidelity, accessibility equivalence, operative clarity where required, and domain correctness where authoritative are hard gates. They are not weighted preferences. A more attractive candidate cannot compensate for a failure at one of those gates.

## Content layers and representations

| Content layer | Purpose |
| --- | --- |
| Operative | Exact action, state, condition, timing, consequence, prohibition, and recovery. |
| Experiential | Context-responsive attention, atmosphere, bodily or material experience, and relational consequence. |
| Interpretive | Optional explanation of concepts, systems, causality, and deferred consequences. |

Accessibility is modeled as a representation rather than an independent source of meaning. Any layer may request an `accessibility-equivalent` realization. It must cover the same relevant semantic atoms without making essential meaning depend on imagery, color, sound, spatial inference, timing perception, or implication.

Experiential or interpretive copy may enrich an operative instruction. It may not contradict it, conceal it, or become necessary to understand it.

## Deterministic realization

Lattice processes a request as a bounded derivation:

```text
strict input validation
→ semantic-contract validation
→ profile compilation
→ contextual rule resolution
→ shared semantic plan
→ layer-specific realization
→ hard validation gates
→ cross-output validation
→ lexicographic ranking
→ derivation receipt
```

Every selected output must trace to semantic atoms through its candidate mapping and registered match evidence. Each sentence must also be licensed by mapped atom evidence or a registered, non-verified claim status. Register rules determine applicability, suppress incompatible features, validate candidates, and influence ranking. They do not execute arbitrary rewrites. Candidate text may vary clause order, cadence, emphasis, focal vocabulary, and permitted framing, but it may not change protected actors, polarity, modality, quantities, units, conditions, timing, direction, consequences, or recovery steps.

Identical canonical requests and engine and profile versions produce byte-identical output. Time, filesystem order, process order, platform locale, and ambient randomness do not participate.

### Current realization boundary

For each requested layer and representation, a caller may supply one or more structured candidates containing text, semantic atom IDs, and optional validation metadata. Lattice rejects candidates that fail hard gates and selects the highest-ranked admissible candidate. When no candidate is supplied for an output, Lattice constructs a deterministic literal baseline from controlled forms or structured frames and labels its conformance `literal`, never `full`.

The bundled profile evaluates and ranks realizations; it does not synthesize novel literary prose. A host that creates candidates by another method must treat them as untrusted input and submit them to the same contract and validation path.

## Owner-only JavaScript quickstart

The following example loads and executes the exclusive register. It is operational documentation for the Licensor. Third parties may inspect it for evaluation but are not licensed to run or adapt it.

```js
import { createEngine } from "@howardhayden/lattice-register-engine";

const engine = createEngine();

const result = engine.realize({
  id: "example.request",
  contract: {
    id: "example.contract",
    revision: "1",
    atoms: [
      {
        id: "example.state",
        kind: "state",
        criticality: "contextual",
        frame: {
          subject: "The rail",
          predicate: "feels",
          object: "cool",
          polarity: "positive",
          modality: "is"
        },
        requiredIn: ["experiential"],
        delivery: { experiential: "explicit" },
        protectedFields: ["subject", "predicate", "object"],
        prohibitedDependencies: [],
        match: { allOf: ["rail", "feels", "cool"] }
      }
    ]
  },
  context: {
    domain: "example",
    surface: "reflection",
    mode: "reflection",
    stakes: "ambient",
    safetyClass: "none",
    locale: "en-US",
    audience: { knowledgeTags: [] },
    channel: {
      visualAvailable: true,
      audioAvailable: true,
      spatialInferenceAllowed: true
    },
    sceneImportance: "minor"
  },
  outputs: [
    { layer: "experiential", representation: "standard" }
  ],
  candidates: [
    {
      id: "example.candidate",
      layer: "experiential",
      representation: "standard",
      text: "The rail feels cool beneath your palm.",
      atomIds: ["example.state"],
      metadata: {
        sensoryAnchors: ["touch"],
        stateChanges: ["example.state"],
        claims: []
      }
    }
  ]
});

console.log(result.outputs[0].text);
console.log(result.receipt.derivationDigest);
```

## Relational Systems Register

The bundled profile favors:

- embodied or material anchors that remain relevant to present action;
- causally connected personal, relational, institutional, and ethical layers;
- focalizer-specific knowledge, vocabulary, bias, and immediate purpose;
- genuine conversational subtext without repeated narratorial decoding;
- exposition that changes knowledge, options, power, risk, attachment, or ethical position;
- high-variance cadence used in response to cognitive and dramatic conditions;
- precise technical or institutional language only when scoped and traceable;
- intimacy expressed through specific attention, labor, reciprocity, and boundaries;
- morally consequential systems whose clean abstractions encounter human asymmetry.

The profile suppresses figurative, implicit, or ornamental behavior when operative, safety-critical, or accessibility-equivalent copy requires direct language.

The exact register, its compiled copies, register-specific fixtures, and register specification are governed by the Exclusive Register License rather than the engine license. See the [restricted register specification](docs/register-specification.md) for its integration boundary.

## Licensing

The controlling scope is file-specific:

| Material | Terms | Third-party permission |
| --- | --- | --- |
| Reusable engine | PolyForm Noncommercial 1.0.0 | Defined noncommercial purposes only. |
| Relational Systems Register | Lattice Exclusive Register License 1.0 | Evaluation inspection only; no functional use. |
| Licensing records | `LICENSE.md` | Retention and copying as necessary to preserve or comply with terms. |

The complete package remains marked `private` and must not be published to a public package registry. A future public engine-only release would have to omit the register, its activation and export, and every register-specific fixture or test.

Read the controlling [license notice](LICENSE.md), [exclusive register terms](REGISTER-LICENSE.md), [scope manifest](license-scope.json), [licensing guide](docs/licensing.md), and [adversarial licensing review](docs/license-red-team.md) before distributing or using any part of the package.

## Owner-only local development

The complete development and verification commands load Register Materials and execute register-specific fixtures. They are not included in the third-party inspection permission.

Requirements:

- Node.js 20 or later
- npm

Install dependencies and run the full local verification path:

```sh
npm install
npm run check
```

Build the package:

```sh
npm run build
```

The package performs no network operations or implicit persistence at runtime. The engine returns its receipt to the caller, which may choose whether and where to retain it.

## Conformance and evidence

A successful result includes output text, atom-to-output mappings, rule dispositions, validator findings, candidate rejection reasons, profile digests, and a reproducible derivation digest.

Receipt verification establishes closed-schema and cross-record self-consistency under the recorded engine version. Result verification also binds every public output field and aggregate conformance. Neither operation authenticates the receipt or proves that input claims were true, that a history is authentic, that a technical statement was independently verified, or that a text is artistically successful.

See [Architecture](docs/architecture.md) for the data flow and trust boundaries, [Requirements](docs/requirements.md) for the normative engine register, and [Licensing requirements](docs/license-requirements.md) for release and distribution gates.

## Known limitations

- Strong semantic guarantees require typed contracts and mapped realizations. Free-form linting is advisory.
- The current engine validates, ranks, and literalizes; it does not synthesize novel register-conformant candidates.
- Deterministic validators can detect registered duplication, coverage, dependency, ordering, and structural problems; they cannot prove genuine subtext, depth, moral adequacy, or literary quality.
- Structural provenance cannot establish the truth or authenticity of the source facts.
- Accessibility-equivalent output still requires testing with users and assistive technology.
- The included lexical and cadence logic is English-oriented. The current release records locale context but does not ship separate locale-specific realization resources, and it fails closed for non-English safety-critical realization.
- A semantically valid phrase that lacks the required atom mapping or match evidence may be rejected.
- Domain correctness depends on caller-supplied terminology, validators, and attestations.
- Lattice emits structured plain text. Rendering, sanitization at UI boundaries, and visual presentation belong to the host application.
