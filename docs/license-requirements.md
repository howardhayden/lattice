# Lattice atomic licensing requirements

This register is normative for packaging and distribution. It supplements the product requirements without altering runtime semantic priorities.

| ID | Requirement | Verification |
| --- | --- | --- |
| LRE-LIC-001 | Every shipped file MUST be assigned to exactly one controlling license scope. | Compare the release inventory with `license-scope.json`; reject omissions and duplicates. |
| LRE-LIC-002 | Current Engine Materials MUST use the Hayden Howard Proprietary Product and Source License 1.0. | Inspect package metadata, scope manifest, and bundled current terms. |
| LRE-LIC-003 | Register Materials MUST retain the Lattice Exclusive Register License and MUST NOT inherit permission from the engine scope. | Verify `register-exclusive` precedence in `LICENSE.md` and the scope manifest. |
| LRE-LIC-004 | Third parties MUST receive no general functional-use grant for Register Materials. | Inspect the Exclusive Register License and proposed-use matrix. |
| LRE-LIC-005 | Register restrictions MUST cover software execution and manual application. | Test the terms against automated and human-authored use cases. |
| LRE-LIC-006 | Register restrictions MUST cover extraction, paraphrase, translation, subsets, recombination, and covered derivatives. | Review representative evasion cases against Sections 2 and 6. |
| LRE-LIC-007 | Register restrictions MUST cover model training, fine-tuning, retrieval, prompting, evaluation, benchmarking, and distillation. | Review each model-use pathway against Section 4. |
| LRE-LIC-008 | Current Engine Materials MUST provide no general personal, noncommercial, educational, institutional, modification, redistribution, self-hosting, or source-integration grant. Official Product use MUST remain limited to the Owner's actual offering or entitlement. | Review source, free-product, paid-product, internal-business, consulting, hosted-service, and redistribution cases. |
| LRE-LIC-009 | The package MUST identify itself as proprietary source-available and MUST NOT claim OSI-approved open-source status. | Scan package documentation and metadata. |
| LRE-LIC-010 | The Required Notice and full current controlling terms MUST ship with every authorized release; retained historical and third-party terms MUST be identified as such. | Package inventory and wording tests. |
| LRE-LIC-011 | The complete owner package MUST remain blocked from public package-registry publication unless separately expressly authorized. | Assert `package.json.private === true`. |
| LRE-LIC-012 | A separate executable or engine-only offering MUST require express Owner authorization and MUST NOT be described as an automatic source-reuse license. | Review release inventory, entitlement terms, and public descriptions. |
| LRE-LIC-013 | The licenses MUST preserve fair use and other non-waivable statutory rights. | Inspect statutory-rights provisions. |
| LRE-LIC-014 | The licenses MUST NOT falsely claim control over uncopyrightable ideas, facts, methods, or independently created material. | Inspect material definitions and guidance. |
| LRE-LIC-015 | Compiled or mechanically transformed Register Materials MUST remain within the exclusive scope. | Compare source and distribution manifests. |
| LRE-LIC-016 | Publication, visibility, attribution, contribution, payment, or technical access MUST NOT be described as implied implementation-reuse permission. | Documentation and terms review. |
| LRE-LIC-017 | Outside contributions MUST NOT enter a release without documented ownership and licensing provenance. | Contribution-evidence gate. |
| LRE-LIC-018 | Any additional Owner-controlled permission MUST require a separate writing signed by the Owner and identify its material and scope. | Inspect terms and exception records. |
| LRE-LIC-019 | Permissions validly attached to earlier distributed copies and third-party terms MUST remain governed by their own terms, without being presented as revoked, as new default grants, or as automatically applicable to a different copy or later distribution. | Inspect `COMMERCIAL_BASELINE.md`, retained terms, changelog, and current guidance. |
| LRE-LIC-020 | The commercial baseline MUST identify parent `029ca14570b3ebe5703f504ab4b4baed90883f84`, first source-available code commit `7d1d980fa92cf0591dacac06f98391b23e93e9f4`, and the absence of an OSI-approved product-code predecessor. | Baseline marker assertion. |

## Release evidence

A licensing-complete release requires:

1. a closed, duplicate-free scope manifest using `engine-proprietary`, `register-exclusive`, and `license-administrative`;
2. all listed files present in the release, including the current proprietary terms, retained historical PolyForm text, and `COMMERCIAL_BASELINE.md`;
3. exact source and compiled profile copies classified as exclusive;
4. package metadata pointing to the controlling split-scope notice and retaining the registry-publication block;
5. an exact prospective baseline record that preserves earlier grants without presenting them as current defaults;
6. public-language scans rejecting open-source, general noncommercial-reuse, and automatic engine-only-release claims except explicit historical explanation or negation;
7. current adversarial review of Official Product access, implementation reuse, payment, register use, redistribution, model use, platform rights, statutory rights, independent creation, and historical grants;
8. complete functional checks showing that the policy-only change did not alter runtime behavior; and
9. qualified legal review before any commercial launch, public release, or enforcement claim.
