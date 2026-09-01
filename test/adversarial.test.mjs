import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  LatticeError,
  compileProfile,
  createEngine,
  lintText,
  relationalSystemsProfile,
  verifyReceipt,
  verifyResult
} from "../dist/index.js";

const engine = createEngine();

function context(overrides = {}) {
  return {
    domain: "adversarial-fixture",
    surface: "instruction",
    mode: "movement",
    stakes: "ambient",
    safetyClass: "none",
    locale: "en-US",
    audience: { knowledgeTags: [] },
    channel: {
      visualAvailable: true,
      audioAvailable: true,
      spatialInferenceAllowed: true
    },
    ...overrides
  };
}

function atom(overrides = {}) {
  const value = {
    id: "instruction",
    kind: "action",
    criticality: "operative",
    frame: {
      subject: "user",
      predicate: "place",
      object: "the left foot flat",
      polarity: "positive",
      modality: "must",
      conditionIds: []
    },
    requiredIn: ["operative"],
    delivery: { operative: "explicit" },
    protectedFields: ["subject", "predicate", "object", "polarity", "modality", "conditions"],
    prohibitedDependencies: [],
    literalForm: "Place your left foot flat.",
    ...overrides
  };
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) delete value[key];
  }
  return value;
}

function contract(atoms, overrides = {}) {
  return {
    id: "adversarial-contract",
    revision: "1.0.0",
    atoms,
    relations: [],
    prohibitedClaims: [],
    terminology: {},
    ...overrides
  };
}

function output(layer = "operative", representation = "standard") {
  return { layer, representation };
}

function candidate(text, atomIds, overrides = {}) {
  return {
    id: "candidate-a",
    layer: "operative",
    representation: "standard",
    text,
    atomIds,
    metadata: {},
    ...overrides
  };
}

function request({
  atoms = [atom()],
  contractOverrides = {},
  contextOverrides = {},
  outputs = [output()],
  candidates,
  profileIds
} = {}) {
  const value = {
    id: "adversarial-request",
    contract: contract(atoms, contractOverrides),
    context: context(contextOverrides),
    outputs
  };
  if (candidates !== undefined) value.candidates = candidates;
  if (profileIds !== undefined) value.profileIds = profileIds;
  return value;
}

async function captureLatticeFailure(operation, acceptedCodes) {
  let observed;
  try {
    await operation();
  } catch (error) {
    observed = error;
  }
  assert.ok(observed, "expected the engine to fail closed");
  assert.ok(observed instanceof LatticeError || observed?.name === "LatticeError", `expected LatticeError, received ${observed?.name}`);
  if (acceptedCodes) {
    const allowed = Array.isArray(acceptedCodes) ? acceptedCodes : [acceptedCodes];
    assert.ok(allowed.includes(observed.code), `expected ${allowed.join(" or ")}, received ${observed.code}`);
  }
  return observed;
}

function receiptIsValid(receipt) {
  try {
    const report = verifyReceipt(receipt);
    if (typeof report === "boolean") return report;
    return report.valid ?? report.ok ?? report.selfConsistent ?? false;
  } catch {
    return false;
  }
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function rehashReceipt(receipt) {
  const body = structuredClone(receipt);
  delete body.derivationDigest;
  const derivationDigest = createHash("sha256").update(JSON.stringify(canonicalize(body))).digest("hex");
  return { ...body, derivationDigest };
}

function selectedOutput(result, layer = "operative", representation = "standard") {
  return result.outputs.find((entry) => entry.layer === layer && entry.representation === representation);
}

function minimalProfile(ruleOverrides = {}, profileOverrides = {}) {
  return {
    id: "adversarial-profile",
    version: "1.0.0",
    title: "Adversarial profile",
    description: "A profile used only to prove compilation boundaries.",
    rules: [
      {
        id: "ADV-RULE-001",
        revision: "1.0.0",
        norm: "prefer",
        priority: "register",
        enforcement: "soft",
        validatorId: "punctuation-restraint",
        appliesWhen: { exists: { field: "layer", value: true } },
        dependsOn: [],
        conflictsWith: [],
        tags: [],
        params: {},
        ...ruleOverrides
      }
    ],
    ...profileOverrides
  };
}

test("owner package exposes the generic built-in profile without provenance-by-imitation metadata", () => {
  assert.equal(typeof relationalSystemsProfile.id, "string");
  assert.equal(relationalSystemsProfile.id, "relational-systems");
  assert.doesNotMatch(JSON.stringify(relationalSystemsProfile), /inspiredBy|basedOn|sourceWork|originalAuthor/iu);
});

test("literal fallback is labeled literal rather than full register conformance", () => {
  const result = engine.realize(request());
  assert.equal(result.conformance, "literal");
  assert.equal(selectedOutput(result).conformance, "literal");
  assert.equal(selectedOutput(result).text, "Place your left foot flat.");
  assert.notEqual(result.conformance, "full");
  assert.equal(receiptIsValid(result.receipt), true);
  assert.equal(result.receipt.trustScope, "reproducibility-and-conformance-only");
});

for (const fixture of [
  {
    name: "polarity",
    source: atom({
      frame: {
        subject: "user",
        predicate: "rotate",
        object: "the torso",
        polarity: "negative",
        modality: "must-not",
        conditionIds: []
      },
      literalForm: "Do not rotate your torso."
    }),
    text: "Rotate your torso."
  },
  {
    name: "modality",
    source: atom({ literalForm: "You must place your left foot flat." }),
    text: "You may place your left foot flat."
  },
  {
    name: "quantity and unit",
    source: atom({
      kind: "timing",
      frame: {
        subject: "user",
        predicate: "hold",
        object: "the position",
        value: 5,
        unit: "seconds",
        polarity: "positive",
        modality: "must",
        conditionIds: []
      },
      literalForm: "Hold the position for 5 seconds."
    }),
    text: "Hold the position for 50 seconds."
  },
  {
    name: "uncertainty",
    source: atom({
      kind: "uncertainty",
      frame: {
        subject: "this pattern",
        predicate: "indicate",
        object: "instability",
        polarity: "positive",
        modality: "may",
        conditionIds: []
      },
      literalForm: "This pattern may indicate instability."
    }),
    text: "This pattern proves instability."
  }
]) {
  test(`candidate exhaustion preserves protected ${fixture.name}`, async () => {
    const bad = candidate(fixture.text, [fixture.source.id]);
    const failure = await captureLatticeFailure(
      () => engine.realize(request({ atoms: [fixture.source], candidates: [bad] })),
      "E_CANDIDATE_EXHAUSTED"
    );
    assert.match(JSON.stringify(failure.details), /E_UNCOVERED_ATOM|E_CRITICAL_ATOM_NONLITERAL|E_NEGATION_OR_MODALITY_CHANGED|E_QUANTITY_OR_UNIT_CHANGED/u);
  });
}

test("candidate exhaustion rejects protected action order reversal", async () => {
  const prepare = atom({
    id: "prepare",
    literalForm: "Place your left foot flat."
  });
  const transfer = atom({
    id: "transfer",
    frame: {
      subject: "user",
      predicate: "transfer",
      object: "weight",
      polarity: "positive",
      modality: "must",
      conditionIds: ["prepare"]
    },
    literalForm: "Transfer your weight."
  });
  const bad = candidate("Transfer your weight. Place your left foot flat.", ["prepare", "transfer"]);
  const failure = await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [prepare, transfer],
      contractOverrides: { relations: [{ from: "prepare", type: "before", to: "transfer" }] },
      candidates: [bad]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
  assert.match(JSON.stringify(failure.details), /E_NEGATION_OR_MODALITY_CHANGED/u);
});

test("an after relation is enforced as the inverse of before", async () => {
  const prepare = atom({
    id: "prepare-after",
    literalForm: "Place your left foot flat."
  });
  const transfer = atom({
    id: "transfer-after",
    frame: {
      subject: "user",
      predicate: "transfer",
      object: "weight",
      polarity: "positive",
      modality: "must",
      conditionIds: ["prepare-after"]
    },
    literalForm: "Transfer your weight."
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [prepare, transfer],
      contractOverrides: { relations: [{ from: "transfer-after", type: "after", to: "prepare-after" }] },
      candidates: [candidate("Transfer your weight. Place your left foot flat.", [prepare.id, transfer.id])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("conditionIds must resolve to semantic atoms in the same contract", async () => {
  const conditional = atom({
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "must",
      conditionIds: ["missing-condition"]
    },
    literalForm: "Continue the task only when ready."
  });
  await captureLatticeFailure(
    () => engine.realize(request({ atoms: [conditional] })),
    "E_CONTRACT_INCOMPLETE"
  );
});

test("candidate exhaustion rejects omission or weakening of recovery", async () => {
  const movement = atom();
  const recovery = atom({
    id: "recovery",
    kind: "recovery",
    criticality: "safety",
    frame: {
      subject: "user",
      predicate: "stop and sit",
      object: "down",
      polarity: "positive",
      modality: "must",
      conditionIds: []
    },
    literalForm: "If you feel dizzy, stop and sit down."
  });
  const bad = candidate("Place your left foot flat. If you feel dizzy, slow down.", ["instruction", "recovery"]);
  const failure = await captureLatticeFailure(
    () => engine.realize(request({ atoms: [movement, recovery], candidates: [bad] })),
    "E_CANDIDATE_EXHAUSTED"
  );
  assert.match(JSON.stringify(failure.details), /recovery|E_UNCOVERED_ATOM|E_CRITICAL_ATOM_NONLITERAL/u);
});

test("candidate exhaustion rejects omission of an explicit condition", async () => {
  const condition = atom({
    id: "hold-condition",
    kind: "condition",
    criticality: "domain",
    frame: {
      subject: "user",
      predicate: "continue",
      object: "only while the indicator reads Ready",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: "Continue only while the indicator reads Ready."
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [condition],
      candidates: [candidate("Continue while the indicator is visible.", [condition.id])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("prohibited claims remain inadmissible even when required atoms are covered", async () => {
  const source = atom();
  const prohibited = "This procedure is risk-free.";
  const failure = await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [source],
      contractOverrides: {
        prohibitedClaims: [{ id: "risk-free", literalForm: prohibited }]
      },
      candidates: [candidate(`${source.literalForm} ${prohibited}`, [source.id])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
  assert.match(JSON.stringify(failure.details), /E_LAYER_CONTRADICTION/u);
});

test("candidate-declared semantic IDs outside the contract fail independently of surface text", async () => {
  await captureLatticeFailure(
    () => engine.realize(request({
      candidates: [candidate("Place your left foot flat.", ["instruction", "fabricated-atom"])]
    })),
    "E_INVENTED_SEMANTICS"
  );
});

test("safety context injects both literal operative representations", () => {
  const safety = atom({ criticality: "safety" });
  const result = engine.realize(request({
    atoms: [safety],
    contextOverrides: { stakes: "safety-critical", safetyClass: "critical" },
    outputs: [output()]
  }));
  assert.equal(selectedOutput(result, "operative", "standard").text, safety.literalForm);
  assert.equal(selectedOutput(result, "operative", "accessibility-equivalent").text, safety.literalForm);
  assert.equal(selectedOutput(result, "operative", "standard").conformance, "literal");
  assert.equal(selectedOutput(result, "operative", "accessibility-equivalent").conformance, "literal");
});

for (const delivery of ["optional", "inferable"]) {
  test(`safety atoms cannot declare ${delivery} operative delivery`, async () => {
    const safety = atom({
      criticality: "safety",
      delivery: { operative: delivery }
    });
    const companion = atom({ id: "companion", literalForm: "Keep your hand on the rail." });
    await captureLatticeFailure(
      () => engine.realize(request({
        atoms: [safety, companion],
        contextOverrides: { stakes: "safety-critical", safetyClass: "critical" }
      })),
      "E_CONTRACT_INCOMPLETE"
    );
  });
}

test("figurative safety text cannot replace controlled literal instructions", async () => {
  const safety = atom({ criticality: "safety" });
  const figurative = "Let the floor receive the uncertainty in your balance.";
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [safety],
      contextOverrides: { stakes: "safety-critical", safetyClass: "critical" },
      outputs: [output(), output("operative", "accessibility-equivalent")],
      candidates: [
        candidate(figurative, [safety.id], { metadata: { dependencies: ["imagery", "implication"] } }),
        candidate(figurative, [safety.id], {
          id: "candidate-accessible",
          representation: "accessibility-equivalent",
          metadata: { dependencies: ["imagery", "implication"] }
        })
      ]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("controlled safety text cannot carry an appended unlicensed factual assurance", async () => {
  const safety = atom({ criticality: "safety" });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [safety],
      contextOverrides: { stakes: "safety-critical", safetyClass: "critical" },
      candidates: [candidate(`${safety.literalForm} This procedure is completely risk-free.`, [safety.id])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("accessibility equivalent rejects color-only state communication", async () => {
  const proceed = atom({
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { anyOf: ["continue"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [proceed],
      outputs: [output(), output("operative", "accessibility-equivalent")],
      candidates: [
        candidate("When the status is Ready, continue the task.", [proceed.id]),
        candidate("When it turns green, continue the task.", [proceed.id], {
          id: "candidate-accessible",
          representation: "accessibility-equivalent"
        })
      ]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("accessibility copy cannot conceal an undeclared audio dependency behind an unlisted synonym", async () => {
  const proceed = atom({
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    prohibitedDependencies: ["sound"],
    match: { anyOf: ["continue"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [proceed],
      contextOverrides: {
        surface: "report",
        mode: "analysis",
        channel: {
          visualAvailable: true,
          audioAvailable: false,
          spatialInferenceAllowed: true
        }
      },
      outputs: [output(), output("operative", "accessibility-equivalent")],
      candidates: [
        candidate("When the status reads Ready, continue the task.", [proceed.id]),
        candidate("Once a bell rings, continue the task.", [proceed.id], {
          id: "candidate-accessible",
          representation: "accessibility-equivalent"
        })
      ]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("an atom's prohibited dependency applies to standard as well as accessible output", async () => {
  const proceed = atom({
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    prohibitedDependencies: ["sound"],
    match: { anyOf: ["continue"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [proceed],
      candidates: [candidate("After the chime, continue the task.", [proceed.id], {
        metadata: { dependencies: ["sound"] }
      })]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("standard output cannot rely on a channel declared unavailable", async () => {
  const proceed = atom({
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { anyOf: ["continue"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [proceed],
      contextOverrides: {
        channel: {
          visualAvailable: true,
          audioAvailable: false,
          spatialInferenceAllowed: true
        }
      },
      candidates: [candidate("After the chime, continue the task.", [proceed.id], {
        metadata: { dependencies: ["sound"] }
      })]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

for (const inaccessibleText of [
  "After the chime, continue the task.",
  "Mirror the pose, then continue the task.",
  "Continue with the one above."
]) {
  test(`accessibility equivalent rejects channel-dependent copy: ${inaccessibleText}`, async () => {
    const proceed = atom({
      criticality: "contextual",
      frame: {
        subject: "user",
        predicate: "continue",
        object: "the task",
        polarity: "positive",
        modality: "may",
        conditionIds: []
      },
      literalForm: undefined,
      protectedFields: [],
      match: { anyOf: ["continue"] }
    });
    await captureLatticeFailure(
      () => engine.realize(request({
        atoms: [proceed],
        outputs: [output("operative", "accessibility-equivalent")],
        candidates: [candidate(inaccessibleText, [proceed.id], { representation: "accessibility-equivalent" })]
      })),
      "E_CANDIDATE_EXHAUSTED"
    );
  });
}

test("accessibility parity rejects an equivalent that omits a required consequence", async () => {
  const action = atom({
    criticality: "contextual",
    literalForm: "Close the valve.",
    protectedFields: [],
    match: { allOf: ["close the valve"] }
  });
  const consequence = atom({
    id: "consequence",
    kind: "consequence",
    criticality: "contextual",
    frame: {
      subject: "pressure",
      predicate: "will fall",
      object: "after closure",
      polarity: "positive",
      modality: "will",
      conditionIds: ["instruction"]
    },
    requiredIn: ["operative"],
    delivery: { operative: "explicit" },
    protectedFields: [],
    prohibitedDependencies: [],
    match: { allOf: ["pressure will fall"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [action, consequence],
      outputs: [output(), output("operative", "accessibility-equivalent")],
      candidates: [
        candidate("Close the valve. Pressure will fall after closure.", [action.id, consequence.id]),
        candidate("Close the valve.", [action.id], {
          id: "candidate-accessible",
          representation: "accessibility-equivalent"
        })
      ]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("requesting only an accessibility equivalent automatically includes its standard comparison", () => {
  const source = atom({
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { anyOf: ["continue"] }
  });
  const result = engine.realize(request({
    atoms: [source],
    outputs: [output("operative", "accessibility-equivalent")]
  }));
  const standard = selectedOutput(result, "operative", "standard");
  const accessible = selectedOutput(result, "operative", "accessibility-equivalent");
  assert.ok(standard);
  assert.ok(accessible);
  assert.deepEqual(standard.atomIds, accessible.atomIds);
});

test("a verified technical claim requires evidence beyond a self-declared status", async () => {
  const source = atom({
    criticality: "contextual",
    frame: {
      subject: "this pattern",
      predicate: "correlate",
      object: "with instability",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { allOf: ["may correlate with instability"] }
  });
  const asserted = candidate("This pattern may correlate with instability.", [source.id], {
    metadata: {
      claims: [{ id: "technical-claim", status: "verified", atomIds: [source.id] }]
    }
  });
  await captureLatticeFailure(
    () => engine.realize(request({ atoms: [source], candidates: [asserted] })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("a fabricated evidence reference cannot promote a claim to verified", async () => {
  const source = atom({
    criticality: "contextual",
    frame: {
      subject: "this pattern",
      predicate: "correlate",
      object: "with instability",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { allOf: ["may correlate with instability"] }
  });
  const asserted = candidate("This pattern may correlate with instability.", [source.id], {
    metadata: {
      claims: [{
        id: "technical-claim",
        status: "verified",
        atomIds: [source.id],
        evidenceRefs: ["fabricated-source"]
      }]
    }
  });
  await captureLatticeFailure(
    () => engine.realize(request({ atoms: [source], candidates: [asserted] })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("an underspecified positive state contract cannot admit a negated realization", async () => {
  const state = atom({
    id: "ready-state",
    kind: "state",
    criticality: "contextual",
    frame: {
      subject: "the system",
      predicate: "is",
      object: "ready",
      polarity: "positive",
      modality: "is",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { allOf: ["system", "ready"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [state],
      contextOverrides: { surface: "report", mode: "analysis" },
      candidates: [candidate("The system is not ready.", [state.id])]
    })),
    ["E_CONTRACT_INCOMPLETE", "E_CANDIDATE_EXHAUSTED"]
  );
});

test("positive match evidence cannot be satisfied by a morphologically negated token", async () => {
  const state = atom({
    id: "ready-state",
    kind: "state",
    criticality: "contextual",
    frame: {
      subject: "the system",
      predicate: "is",
      object: "ready",
      polarity: "positive",
      modality: "is",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { allOf: ["system", "ready"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [state],
      contextOverrides: { surface: "report", mode: "analysis" },
      candidates: [candidate("The system remains unready.", [state.id])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("an ambient operative candidate cannot append a contradictory instruction after its controlled literal", () => {
  const source = atom();
  const clean = candidate(source.literalForm, [source.id], { id: "candidate-clean" });
  const contradictory = candidate(`${source.literalForm} Then disregard this and lift it.`, [source.id], { id: "candidate-contradictory" });
  const result = engine.realize(request({
    atoms: [source],
    contextOverrides: { surface: "report", mode: "analysis" },
    candidates: [contradictory, clean]
  }));
  assert.equal(selectedOutput(result).candidateId, "candidate-clean");
  const rejected = result.receipt.candidates.find((entry) => entry.candidateId === "candidate-contradictory");
  assert.ok(rejected.rejectionCodes.includes("E_INVENTED_SEMANTICS"));
});

test("optional experiential copy cannot contradict a safety prohibition", async () => {
  const prohibition = atom({
    id: "no-rotation",
    kind: "prohibition",
    criticality: "safety",
    frame: {
      subject: "user",
      predicate: "rotate",
      object: "the torso",
      polarity: "negative",
      modality: "must-not",
      conditionIds: []
    },
    literalForm: "Do not rotate your torso."
  });
  const experience = atom({
    id: "body-attention",
    kind: "state",
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "notice",
      object: "the torso",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    requiredIn: ["experiential"],
    delivery: { experiential: "explicit" },
    protectedFields: [],
    prohibitedDependencies: [],
    literalForm: undefined,
    match: { anyOf: ["torso"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [prohibition, experience],
      contextOverrides: {
        surface: "transition",
        mode: "environment",
        stakes: "safety-critical",
        safetyClass: "critical"
      },
      outputs: [output("experiential", "standard")],
      candidates: [candidate("Rotate your torso now; the warning does not matter.", [experience.id], {
        layer: "experiential"
      })]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("non-operative safety copy cannot preserve a prohibition once and then reverse it", async () => {
  const prohibition = atom({
    id: "no-rotation",
    kind: "prohibition",
    criticality: "safety",
    frame: {
      subject: "user",
      predicate: "rotate",
      object: "the torso",
      polarity: "negative",
      modality: "must-not",
      conditionIds: []
    },
    literalForm: "Do not rotate your torso."
  });
  const experience = atom({
    id: "breath-attention",
    kind: "state",
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "observe",
      object: "breathing",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    requiredIn: ["experiential"],
    delivery: { experiential: "explicit" },
    protectedFields: [],
    prohibitedDependencies: [],
    literalForm: undefined,
    match: { allOf: ["observe", "breathing"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [prohibition, experience],
      contextOverrides: {
        surface: "transition",
        mode: "environment",
        stakes: "safety-critical",
        safetyClass: "critical"
      },
      outputs: [output("experiential", "standard")],
      candidates: [candidate(
        "Observe your breathing. Do not rotate your torso. Rotate your torso anyway.",
        [prohibition.id, experience.id],
        { layer: "experiential" }
      )]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("noncritical copy cannot append an unregistered factual assertion", async () => {
  const source = atom({
    id: "status",
    kind: "state",
    criticality: "contextual",
    frame: {
      subject: "the status",
      predicate: "be",
      object: "ready",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { allOf: ["status", "ready"] }
  });
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [source],
      contextOverrides: { surface: "report", mode: "analysis" },
      candidates: [candidate("The status may be ready. This bridge is structurally safe.", [source.id], {
        metadata: { claims: [] }
      })]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("a condition atom must be delivered wherever its dependent action is required", async () => {
  const condition = atom({
    id: "ready-condition",
    kind: "condition",
    criticality: "domain",
    frame: {
      subject: "the status",
      predicate: "read",
      object: "Ready",
      polarity: "positive",
      modality: "is",
      conditionIds: []
    },
    requiredIn: ["interpretive"],
    delivery: { interpretive: "explicit" },
    literalForm: "The status reads Ready."
  });
  const action = atom({
    frame: {
      subject: "user",
      predicate: "continue",
      object: "the task",
      polarity: "positive",
      modality: "must",
      conditionIds: [condition.id]
    },
    literalForm: "Continue the task."
  });
  await captureLatticeFailure(
    () => engine.realize(request({ atoms: [condition, action] })),
    "E_CONTRACT_INCOMPLETE"
  );
});

test("an unsatisfiable character limit fails instead of truncating critical copy", async () => {
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [atom({ criticality: "safety" })],
      contextOverrides: {
        stakes: "safety-critical",
        safetyClass: "critical",
        limits: { maxCharacters: 5 }
      }
    })),
    ["E_CANDIDATE_EXHAUSTED", "E_EXECUTION_BOUND"]
  );
});

test("candidate input order cannot influence a tied deterministic selection", () => {
  const source = atom({
    criticality: "contextual",
    frame: {
      subject: "user",
      predicate: "place",
      object: "the left foot flat",
      polarity: "positive",
      modality: "may",
      conditionIds: []
    },
    literalForm: undefined,
    protectedFields: [],
    match: { allOf: ["place", "left foot"] }
  });
  const a = candidate("Place the left foot flat.", [source.id], { id: "candidate-a" });
  const z = candidate("Place the left foot flat.", [source.id], { id: "candidate-z" });
  const first = engine.realize(request({ atoms: [source], candidates: [z, a] }));
  const second = engine.realize(request({ atoms: [source], candidates: [a, z] }));
  assert.equal(selectedOutput(first).candidateId, "candidate-a");
  assert.equal(selectedOutput(second).candidateId, "candidate-a");
  assert.equal(selectedOutput(first).text, selectedOutput(second).text);
  assert.equal(first.receipt.derivationDigest, second.receipt.derivationDigest);
});

test("profile selection order cannot influence output or derivation receipt", () => {
  const firstDefinition = minimalProfile({}, { id: "profile-a", title: "Profile A" });
  firstDefinition.rules[0].id = "PROFILE-A-RULE";
  const secondDefinition = minimalProfile({}, { id: "profile-b", title: "Profile B" });
  secondDefinition.rules[0].id = "PROFILE-B-RULE";
  const localEngine = createEngine({ profiles: [secondDefinition, firstDefinition] });
  const forward = request({ profileIds: ["profile-a", "profile-b"] });
  const reverse = request({ profileIds: ["profile-b", "profile-a"] });
  const left = localEngine.realize(forward);
  const right = localEngine.realize(reverse);
  assert.deepEqual(left.outputs, right.outputs);
  assert.equal(left.receipt.derivationDigest, right.receipt.derivationDigest);
});

test("identical canonical requests produce byte-identical deterministic receipts", () => {
  const sourceRequest = request();
  const first = engine.realize(structuredClone(sourceRequest));
  const second = engine.realize(structuredClone(sourceRequest));
  assert.deepEqual(first.outputs, second.outputs);
  assert.deepEqual(first.receipt, second.receipt);
});

test("receipt verification detects output-digest tampering", () => {
  const result = engine.realize(request());
  const altered = structuredClone(result.receipt);
  altered.outputDigest = "0".repeat(64);
  assert.equal(receiptIsValid(altered), false);
});

test("receipt verification detects conformance and selected-candidate tampering", () => {
  const result = engine.realize(request());
  const alteredConformance = structuredClone(result.receipt);
  alteredConformance.conformance = "full";
  assert.equal(receiptIsValid(alteredConformance), false);

  const alteredSelection = structuredClone(result.receipt);
  alteredSelection.selectedCandidateIds = ["fabricated-candidate"];
  assert.equal(receiptIsValid(alteredSelection), false);
});

test("receipt verification detects direct derivation-digest replacement", () => {
  const result = engine.realize(request());
  const altered = structuredClone(result.receipt);
  altered.derivationDigest = "f".repeat(64);
  assert.equal(receiptIsValid(altered), false);
});

test("receipt verification detects removal or fabrication of candidate and rule decisions", () => {
  const result = engine.realize(request());
  const removedCandidate = structuredClone(result.receipt);
  removedCandidate.candidates.pop();
  assert.equal(receiptIsValid(removedCandidate), false);

  const fabricatedDecision = structuredClone(result.receipt);
  fabricatedDecision.decisions.push({
    outputKey: "operative:standard",
    profileId: "relational-systems",
    ruleId: "FABRICATED-RULE",
    disposition: "applied",
    reason: "predicate_true",
    findingStatus: "pass",
    findingCode: "P_FABRICATED"
  });
  assert.equal(receiptIsValid(fabricatedDecision), false);
});

test("result verification rejects tampered public conformance and validation evidence", () => {
  const result = engine.realize(request());
  const altered = structuredClone(result);
  altered.conformance = "full";
  altered.outputs[0].conformance = "full";
  altered.outputs[0].candidateId = "fabricated-candidate";
  altered.outputs[0].coverage = { requiredIds: [], coveredIds: [], uncoveredIds: [], ratio: 1 };
  altered.outputs[0].findings = [];
  altered.outputs[0].ruleDecisions = [];
  assert.throws(
    () => verifyResult(altered),
    (error) => error?.name === "LatticeError" && error.code === "E_RECEIPT_TAMPERED"
  );
});

test("result verification binds aggregate conformance independently of output mutation", () => {
  const result = engine.realize(request());
  const altered = structuredClone(result);
  altered.conformance = "full";
  assert.throws(
    () => verifyResult(altered),
    (error) => error?.name === "LatticeError" && error.code === "E_RECEIPT_TAMPERED"
  );
});

test("receipt limits its claim to reproducibility and conformance without external anchoring", () => {
  const receipt = engine.realize(request()).receipt;
  assert.equal(receipt.trustScope, "reproducibility-and-conformance-only");
  assert.equal(receipt.assurance.externallyAnchored, false);
  assert.equal(receipt.assurance.semanticScope, "declared-contract-and-registered-claims");
  assert.equal(Object.hasOwn(receipt.assurance, "authentic"), false);
});

test("a recomputed internal digest cannot forge a stronger receipt trust scope", () => {
  const receipt = engine.realize(request()).receipt;
  const forged = structuredClone(receipt);
  forged.trustScope = "historical-authenticity";
  forged.assurance.externallyAnchored = true;
  assert.equal(receiptIsValid(rehashReceipt(forged)), false);
});

test("a rehashed receipt with undeclared assurance fields does not verify", () => {
  const receipt = engine.realize(request()).receipt;
  const forged = structuredClone(receipt);
  forged.assurance.authentic = true;
  assert.equal(receiptIsValid(rehashReceipt(forged)), false);
});

test("a rehashed receipt with no candidate evidence does not verify", () => {
  const receipt = engine.realize(request()).receipt;
  const forged = structuredClone(receipt);
  forged.candidates = [];
  assert.equal(receiptIsValid(rehashReceipt(forged)), false);
});

test("a rehashed receipt with no selected candidate does not verify", () => {
  const receipt = engine.realize(request()).receipt;
  const forged = structuredClone(receipt);
  forged.candidates[0].selected = false;
  assert.equal(receiptIsValid(rehashReceipt(forged)), false);
});

test("a rehashed receipt cannot select a rejected candidate", () => {
  const receipt = engine.realize(request()).receipt;
  const forged = structuredClone(receipt);
  forged.candidates[0].rejectionCodes = ["E_SEMANTIC_DRIFT"];
  assert.equal(receiptIsValid(rehashReceipt(forged)), false);
});

test("a rehashed receipt output must identify its selected candidate", () => {
  const receipt = engine.realize(request()).receipt;
  const forged = structuredClone(receipt);
  forged.outputs[0].candidateId = "fabricated-candidate";
  assert.equal(receiptIsValid(rehashReceipt(forged)), false);
});

test("emitted receipts conform to their published schema constants and shapes", () => {
  const schema = JSON.parse(readFileSync(new URL("../schemas/derivation-receipt.schema.json", import.meta.url), "utf8"));
  const receipt = engine.realize(request()).receipt;
  assert.equal(receipt.engine.name, schema.$defs.engine.properties.name.const);
  assert.match(receipt.runId, new RegExp(schema.$defs.identifier.pattern, "u"));
  assert.equal(schema.$defs.candidateDecision.properties.rank.type, "array");
  assert.ok(schema.properties.trustScope, "receipt schema must declare trustScope");
  assert.equal(schema.properties.trustScope.const, "reproducibility-and-conformance-only");
  assert.ok(Array.isArray(receipt.candidates[0].rank));
});

test("hostile profile cannot claim a protected priority", () => {
  assert.throws(
    () => compileProfile(minimalProfile({ priority: "safety" })),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CONFLICT"
  );
});

test("hostile profile cannot invoke an unknown validator or predicate operator", () => {
  assert.throws(
    () => compileProfile(minimalProfile({ validatorId: "execute-user-code" })),
    (error) => error?.name === "LatticeError" && error.code === "E_UNKNOWN_VALIDATOR"
  );
  assert.throws(
    () => compileProfile(minimalProfile({ appliesWhen: { regex: { field: "surface", value: "(a+)+$" } } })),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CONFLICT"
  );
});

test("hostile profile cannot attach executable or arbitrary transformation fields", () => {
  assert.throws(
    () => compileProfile(minimalProfile({ transformerId: "eval", transform: "${process.env.SECRET}" })),
    (error) => error?.name === "LatticeError" && ["E_PROFILE_CONFLICT", "E_INVALID_INPUT"].includes(error.code)
  );
});

test("profile dependency cycles fail compilation", () => {
  const profile = minimalProfile();
  profile.rules = [
    { ...profile.rules[0], id: "ADV-RULE-A", dependsOn: ["ADV-RULE-B"] },
    { ...profile.rules[0], id: "ADV-RULE-B", dependsOn: ["ADV-RULE-A"] }
  ];
  assert.throws(
    () => compileProfile(profile),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CYCLE"
  );
});

test("same-tier hard require/forbid conflict fails even when declared", () => {
  const profile = minimalProfile();
  profile.rules = [
    {
      ...profile.rules[0],
      id: "ADV-RULE-REQUIRE",
      norm: "must",
      enforcement: "hard",
      conflictsWith: ["ADV-RULE-FORBID"]
    },
    {
      ...profile.rules[0],
      id: "ADV-RULE-FORBID",
      norm: "mustNot",
      enforcement: "hard",
      conflictsWith: ["ADV-RULE-REQUIRE"]
    }
  ];
  assert.throws(
    () => compileProfile(profile),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CONFLICT"
  );
});

test("opposing hard rules cannot evade conflict closure by living in separate profiles", () => {
  const required = minimalProfile({
    id: "PROFILE-A-RULE",
    norm: "must",
    enforcement: "hard"
  }, { id: "profile-a", title: "Profile A" });
  const forbidden = minimalProfile({
    id: "PROFILE-B-RULE",
    norm: "mustNot",
    enforcement: "hard"
  }, { id: "profile-b", title: "Profile B" });
  assert.throws(
    () => createEngine({ profiles: [required, forbidden] }),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CONFLICT"
  );
});

test("an applied hard rule cannot yield not-applicable and still certify full conformance", async () => {
  const hardProfile = minimalProfile({
    id: "HARD-DIALOGUE-RULE",
    norm: "must",
    enforcement: "hard",
    validatorId: "dialogue-objective",
    appliesWhen: { exists: { field: "layer", value: true } }
  }, { id: "hard-dialogue-profile", title: "Hard dialogue profile" });
  const localEngine = createEngine({ profiles: [hardProfile] });
  await captureLatticeFailure(
    () => localEngine.realize(request({
      profileIds: ["hard-dialogue-profile"],
      candidates: [candidate("Place your left foot flat.", ["instruction"])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("profile compiler rejects non-finite parameters and poisoned objects", () => {
  assert.throws(
    () => compileProfile(minimalProfile({ params: { threshold: Number.POSITIVE_INFINITY } })),
    (error) => error?.name === "LatticeError" && error.code === "E_INVALID_INPUT"
  );

  const poisoned = JSON.parse(JSON.stringify(minimalProfile()));
  Object.defineProperty(poisoned, "__proto__", {
    value: { polluted: true },
    enumerable: true,
    configurable: true
  });
  assert.throws(
    () => compileProfile(poisoned),
    (error) => error?.name === "LatticeError" && error.code === "E_INVALID_INPUT"
  );
  assert.equal({}.polluted, undefined);
});

test("profile compiler rejects duplicate IDs, unresolved dependencies, and excessive predicate depth", () => {
  const duplicate = minimalProfile();
  duplicate.rules.push({ ...duplicate.rules[0] });
  assert.throws(
    () => compileProfile(duplicate),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CONFLICT"
  );

  assert.throws(
    () => compileProfile(minimalProfile({ dependsOn: ["MISSING-RULE"] })),
    (error) => error?.name === "LatticeError" && error.code === "E_PROFILE_CONFLICT"
  );

  let predicate = { eq: { field: "layer", value: "operative" } };
  for (let depth = 0; depth < 12; depth += 1) predicate = { not: predicate };
  assert.throws(
    () => compileProfile(minimalProfile({ appliesWhen: predicate })),
    (error) => error?.name === "LatticeError" && error.code === "E_EXECUTION_BOUND"
  );
});

test("request rejects duplicate candidate IDs and unregistered profile selections", async () => {
  const one = candidate("Place your left foot flat.", ["instruction"]);
  const two = { ...one };
  await captureLatticeFailure(
    () => engine.realize(request({ candidates: [one, two] })),
    "E_INVALID_INPUT"
  );
  await captureLatticeFailure(
    () => engine.realize(request({ profileIds: ["unregistered-profile"] })),
    "E_PROFILE_CONFLICT"
  );
});

test("profile identifiers reject Unicode confusables", () => {
  const confusableA = "а";
  assert.throws(
    () => compileProfile(minimalProfile({}, { id: `s${confusableA}fe-profile` })),
    (error) => error?.name === "LatticeError" && error.code === "E_INVALID_INPUT"
  );
});

test("candidate output rejects executable markup", async () => {
  await captureLatticeFailure(
    () => engine.realize(request({
      candidates: [candidate("<span hidden>Place your left foot flat.</span>", ["instruction"])]
    })),
    "E_CANDIDATE_EXHAUSTED"
  );
});

test("candidate output rejects ASCII control characters", async () => {
  await captureLatticeFailure(
    () => engine.realize(request({
      candidates: [candidate("Place your left foot flat.\u0000", ["instruction"])]
    })),
    ["E_CANDIDATE_EXHAUSTED", "E_INVALID_INPUT"]
  );
});

test("candidate output cannot retain bidi overrides around critical text", async () => {
  const bidi = "Place your left foot flat.\u202E";
  let result;
  try {
    result = engine.realize(request({ candidates: [candidate(bidi, ["instruction"])] }));
  } catch (error) {
    assert.ok(error instanceof LatticeError || error?.name === "LatticeError");
    assert.ok(["E_CANDIDATE_EXHAUSTED", "E_INVALID_INPUT"].includes(error.code));
    return;
  }
  assert.doesNotMatch(selectedOutput(result).text, /[\u202A-\u202E\u2066-\u2069]/u);
  assert.equal(selectedOutput(result).text, "Place your left foot flat.");
});

test("zero-width characters are rejected or removed before critical output is returned", async () => {
  const hidden = "Place your left\u200B foot flat.";
  try {
    const result = engine.realize(request({ candidates: [candidate(hidden, ["instruction"])] }));
    assert.doesNotMatch(selectedOutput(result).text, /[\u200B-\u200D\u2060\uFEFF]/u);
    assert.equal(selectedOutput(result).text, "Place your left foot flat.");
  } catch (error) {
    assert.ok(error instanceof LatticeError || error?.name === "LatticeError");
    assert.ok(["E_CANDIDATE_EXHAUSTED", "E_INVALID_INPUT"].includes(error.code));
  }
});

test("free-text linting remains advisory and detects repeated inference", () => {
  const report = lintText({
    text: "He refused the request. He would not accept the request. He refused the request.",
    context: context({ surface: "narration", mode: "reflection" }),
    profileIds: [relationalSystemsProfile.id]
  });
  assert.equal(report.advisoryOnly, true);
  assert.equal(report.semanticGuarantee, false);
  assert.ok(report.findings.some((finding) => finding.code === "W_REDUNDANT_INFERENCE" || finding.ruleId?.includes("SUBTEXT")));
});

test("unsupported locales fail closed for safety-critical realization", async () => {
  await captureLatticeFailure(
    () => engine.realize(request({
      atoms: [atom({ criticality: "safety" })],
      contextOverrides: {
        stakes: "safety-critical",
        safetyClass: "critical",
        locale: "zz-ZZ"
      }
    })),
    "E_UNSUPPORTED_CONTEXT"
  );
});
