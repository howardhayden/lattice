# Runnable examples

The request fixtures in this directory are Register Materials governed by the Lattice Exclusive Register License. They may be visually inspected for evaluation but may not be executed, applied, adapted, redistributed, or used to derive another register. `run.mjs` and this explanatory file remain Engine Materials under the package’s PolyForm Noncommercial scope.

Each request contains a semantic contract, context, requested layer and representation pairs, and inspectable candidates. Together, the fixtures exercise:

- operative copy that preserves exact action or state;
- experiential copy grounded in present perception;
- interpretive copy that explains causality without altering the contract;
- accessibility-equivalent copy with the same semantic atoms and no required sensory channel or implied instruction.

Owner only — run every fixture:

```sh
npm run example
```

Owner only — run one fixture through the example harness:

```sh
npm run example -- examples/supported-movement.request.json
```

Owner only — run one fixture through the command-line interface after building:

```sh
npm run build
node dist/cli.js realize examples/belief-summary.request.json
```

The bundled requests are:

| File | Context | Accessibility-equivalent pair |
| --- | --- | --- |
| `supported-movement.request.json` | Safety-critical supported movement | Operative |
| `belief-summary.request.json` | Consequence summary for collective belief | Interpretive |
| `contact-loss-review.request.json` | Operational contact-loss review | Experiential |
| `export-mismatch-notice.request.json` | Public notice for a records mismatch | Operative |

The engine may report `degraded` conformance when an applicable semantic-quality rule requires human review. A degraded result is explicit evidence of unresolved review; it is not silently promoted to full conformance.
