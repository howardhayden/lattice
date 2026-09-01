# Lattice licensing guide

This guide explains the package’s licensing boundary in practical terms. It does not replace [`LICENSE.md`](../LICENSE.md), the [PolyForm terms](../LICENSES/PolyForm-Noncommercial-1.0.0.md), the [Exclusive Register License](../REGISTER-LICENSE.md), or the controlling path manifest in [`license-scope.json`](../license-scope.json).

## Classification

Lattice is **source-available, not open source**. Two scopes apply:

| Scope | Governing terms | Practical result |
| --- | --- | --- |
| Engine Materials | PolyForm Noncommercial 1.0.0 | The engine may be used, studied, changed, and redistributed only for purposes permitted by PolyForm. Commercial use is not granted. |
| Register Materials | Lattice Exclusive Register License 1.0 | Third parties may retain and visually inspect evaluation copies, but may not functionally use, execute, apply, adapt, extract, redistribute, train on, or commercialize the exact register. |
| License-administrative files | `LICENSE.md` | Notices and terms may be retained and copied as needed for compliance. |

## Decision matrix

| Proposed activity | Engine with an independently created profile | Relational Systems Register |
| --- | --- | --- |
| Read for portfolio evaluation | Permitted | Permitted as visual inspection |
| Personal experiment with no anticipated commercial application | Permitted under PolyForm | Not permitted |
| Use by a qualifying noncommercial organization | Permitted under PolyForm | Not permitted |
| Modify privately for a permitted noncommercial purpose | Permitted under PolyForm | Not permitted |
| Redistribute for a permitted noncommercial purpose with required notices | Permitted under PolyForm | Not permitted |
| Internal use by a commercial organization | Not permitted | Not permitted |
| Paid work, consulting, hosted service, or monetized product | Not permitted | Not permitted |
| Apply the rules manually rather than through software | Not applicable | Not permitted |
| Extract a subset, paraphrase the rules, or build a derived register | Not applicable | Not permitted where it copies or adapts protected expression |
| AI training, fine-tuning, retrieval, prompting, evaluation, or benchmarking | Only for a permitted engine purpose and without Register Materials | Not permitted |
| Independent creation without copying protected expression | Permitted, subject to other applicable rights | Not restricted by this package’s copyright license |
| Fair use or another non-waivable statutory exception | Unchanged | Unchanged |

## Why the scopes are separate

The engine is reusable infrastructure. Its noncommercial license allows inspection, personal research, and qualifying institutional use while reserving commercialization.

The register is the distinctive authored system: its atom selection, wording, arrangement, interactions, examples, and evaluative logic. Making the engine inspectable does not require granting others the right to use that register. The exclusive scope therefore overrides the engine scope wherever the manifest classifies a file as `register-exclusive`.

## Distribution policy

The complete owner package contains both scopes and remains marked `private` in `package.json`. It must not be published to a public package registry as-is.

If a public engine release is ever desired, create a separate release that:

1. omits every `register-exclusive` file;
2. removes the built-in-register export and default activation;
3. substitutes neutral fixtures and tests created independently of the register;
4. retains the PolyForm terms and Required Notice;
5. passes the license-scope audit; and
6. is reviewed as a distinct release rather than treating owner-package approval as publication approval.

Publishing source exposes the bytes even when the license forbids their use. If practical exclusivity matters, access control and private distribution are stronger controls than license text alone. The license supplies legal terms; it is not digital-rights management.

## Commercial permissions

This distribution offers no commercial license and no third-party register-use license. Any exception must be granted separately in a writing signed by Hayden Howard. Silence, contribution, repository access, technical interoperability, or attribution is not permission.

## Contribution policy

Do not accept outside contributions without a contributor agreement that preserves the Licensor’s ability to enforce and separately license the affected scope. A pull request alone should not be treated as sufficient provenance for register changes.

## Package and repository labels

Use these descriptions consistently:

- **Correct:** proprietary source-available software; noncommercial engine license; exclusive register.
- **Incorrect:** open source, open-source register, free software, community register, or publicly licensed writing voice.

## Legal review

The scope is engineered to express the intended policy clearly, but enforceability and available remedies vary by jurisdiction and facts. Before public release, commercial negotiation, or enforcement, have qualified intellectual-property counsel review the package, ownership chain, contributor history, and distribution method.
