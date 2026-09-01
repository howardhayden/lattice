# Lattice atomic licensing requirements

This register is normative for packaging and distribution. It supplements the product requirements without altering runtime semantic priorities.

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-LIC-001 | Every shipped file MUST be assigned to exactly one controlling license scope. | Compare the release inventory with `license-scope.json`; reject omissions and duplicates. |
| LRE-LIC-002 | Engine Materials MUST use PolyForm Noncommercial 1.0.0. | Inspect package metadata, scope manifest, and bundled terms. |
| LRE-LIC-003 | Register Materials MUST NOT inherit the engine’s PolyForm grant. | Verify `register-exclusive` precedence in `LICENSE.md` and the scope manifest. |
| LRE-LIC-004 | Third parties MUST receive no functional-use grant for Register Materials. | Inspect the Exclusive Register License and proposed-use matrix. |
| LRE-LIC-005 | Register restrictions MUST cover software execution and manual application. | Test the terms against automated and human-authored use cases. |
| LRE-LIC-006 | Register restrictions MUST cover extraction, paraphrase, translation, subsets, recombination, and covered derivatives. | Review representative evasion cases against Sections 2 and 6. |
| LRE-LIC-007 | Register restrictions MUST cover AI training, fine-tuning, retrieval, prompting, evaluation, benchmarking, and distillation. | Review each model-use pathway against Section 4. |
| LRE-LIC-008 | Neither license scope MUST grant commercial use. | Review internal-business, consulting, SaaS, resale, and advertising-supported cases. |
| LRE-LIC-009 | The package MUST identify itself as source-available and MUST NOT claim OSI-approved open-source status. | Scan package documentation and metadata. |
| LRE-LIC-010 | The Required Notice and full controlling terms MUST ship with every release. | Package inventory test. |
| LRE-LIC-011 | The complete owner package MUST remain blocked from public package-registry publication. | Assert `package.json.private === true`. |
| LRE-LIC-012 | A future public engine-only release MUST omit every Register Material and remove default register activation. | Separate-release inventory and behavior test. |
| LRE-LIC-013 | The license MUST preserve fair use and other non-waivable statutory rights. | Inspect statutory-rights provisions. |
| LRE-LIC-014 | The license MUST NOT falsely claim control over uncopyrightable ideas, facts, methods, or independently created material. | Inspect the Register Materials definition and guidance. |
| LRE-LIC-015 | Compiled or mechanically transformed Register Materials MUST remain within the exclusive scope. | Compare source and distribution manifests. |
| LRE-LIC-016 | Publication, visibility, attribution, contribution, or technical access MUST NOT be described as implied permission. | Documentation and terms review. |
| LRE-LIC-017 | Outside contributions MUST NOT enter a release without documented ownership and licensing provenance. | Contribution-evidence gate. |
| LRE-LIC-018 | Any exception MUST require a separate writing signed by the Licensor. | Inspect terms and exception records. |

## Release evidence

A licensing-complete release requires:

1. a closed, duplicate-free scope manifest;
2. all listed files present in the release;
3. exact source and compiled profile copies classified as exclusive;
4. package metadata pointing to `LICENSE.md`;
5. public-language scans rejecting “open source” claims except explicit negation or explanatory warnings;
6. preserved review of commercial, redistribution, manual-use, derivative, AI-use, statutory-rights, and independent-creation boundaries; and
7. legal review before any public release or enforcement claim.
