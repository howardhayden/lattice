import { access, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = [
  "README.md",
  "COMMERCIAL_BASELINE.md",
  "LICENSE.md",
  "REGISTER-LICENSE.md",
  "LICENSES/Hayden-Proprietary-1.1.md",
  "LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md",
  "LICENSES/PolyForm-Noncommercial-1.0.0.md",
  "license-scope.json",
  "docs/architecture.md",
  "docs/licensing.md",
  "docs/license-requirements.md",
  "docs/license-red-team.md",
  "docs/register-specification.md",
  "docs/requirements.md",
  "examples/run.mjs",
  "schemas/register-profile.schema.json",
  "schemas/license-scope.schema.json",
  "schemas/realization-request.schema.json",
  "profiles/relational-systems.profile.json",
  "dist/index.js",
  "types/index.d.ts"
];

for (const path of required) await access(join(root, path));

const textExtensions = new Set([".js", ".ts", ".json", ".md", ".mjs"]);
const forbiddenExecutablePatterns = [
  /\beval\s*\(/u,
  /new\s+Function\s*\(/u,
  /child_process/u,
  /https?:\/\//u
];
const forbiddenProvenancePatterns = [
  /catalysis/iu,
  /fictional\s+writing\s+voice/iu
];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }
    if (!textExtensions.has(extname(path))) continue;
    if (path.endsWith("scripts/check.mjs")) continue;
    const content = await readFile(path, "utf8");
    if (extname(path) === ".json") JSON.parse(content);
    for (const pattern of forbiddenExecutablePatterns) {
      if (pattern.source === "https?:\\/\\/" && path.includes("/LICENSES/")) continue;
      if (pattern.test(content)) throw new Error(`Unsafe or network-capable construct in ${path}`);
    }
    for (const pattern of forbiddenProvenancePatterns) {
      if (pattern.test(content)) throw new Error(`Prohibited provenance reference in ${path}`);
    }
  }
}

await scan(root);

const packagePayload = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (packagePayload.license !== "SEE LICENSE IN LICENSE.md") {
  throw new Error("Package metadata must point to the current split-scope license notice");
}
if (packagePayload.private !== true) {
  throw new Error("The owner package must remain private and blocked from registry publication");
}

const scopeManifest = JSON.parse(await readFile(join(root, "license-scope.json"), "utf8"));
const expectedScopes = ["register-exclusive", "engine-proprietary", "license-administrative"];
if (Object.keys(scopeManifest.scopes).sort().join("|") !== expectedScopes.sort().join("|")) {
  throw new Error("License scope manifest is not closed");
}
if (scopeManifest.version !== "2.0.0") {
  throw new Error("License scope manifest must use the commercial-baseline schema version");
}
const proprietaryScope = scopeManifest.scopes["engine-proprietary"];
if (proprietaryScope.license !== "LicenseRef-Hayden-Proprietary-1.1"
  || proprietaryScope.terms !== "LICENSES/Hayden-Proprietary-1.1.md") {
  throw new Error("Engine Materials must use the approved proprietary terms");
}
const administrativeFiles = new Set(scopeManifest.scopes["license-administrative"].files);
for (const historicalOrAdministrativePath of [
  "COMMERCIAL_BASELINE.md",
  "LICENSES/Hayden-Proprietary-1.1.md",
  "LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md",
  "LICENSES/PolyForm-Noncommercial-1.0.0.md"
]) {
  if (!administrativeFiles.has(historicalOrAdministrativePath)) {
    throw new Error(`Licensing evidence escaped administrative scope: ${historicalOrAdministrativePath}`);
  }
}
for (const historicalTerms of [
  "LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md",
  "LICENSES/PolyForm-Noncommercial-1.0.0.md"
]) {
  if (proprietaryScope.files.includes(historicalTerms)) {
    throw new Error(`Historical terms must not be the current engine license: ${historicalTerms}`);
  }
}

const classified = new Map();
for (const [scopeName, scope] of Object.entries(scopeManifest.scopes)) {
  await access(join(root, scope.terms));
  for (const relativePath of scope.files) {
    if (classified.has(relativePath)) {
      throw new Error(`License scope overlap for ${relativePath}`);
    }
    await access(join(root, relativePath));
    classified.set(relativePath, scopeName);
  }
}

const inventory = [];
async function inventoryFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await inventoryFiles(path);
      continue;
    }
    if ([".tgz", ".zip"].includes(extname(path))) continue;
    inventory.push(path.slice(root.length + 1));
  }
}
await inventoryFiles(root);

for (const relativePath of inventory) {
  if (!classified.has(relativePath)) {
    throw new Error(`Unclassified release file: ${relativePath}`);
  }
}
for (const relativePath of classified.keys()) {
  if (!inventory.includes(relativePath)) {
    throw new Error(`Classified file is absent from release inventory: ${relativePath}`);
  }
}

const exclusive = new Set(scopeManifest.scopes["register-exclusive"].files);
for (const requiredExclusivePath of [
  "profiles/relational-systems.profile.json",
  "dist/profiles/relational-systems.profile.json",
  "docs/register-specification.md",
  "test/adversarial.test.mjs"
]) {
  if (!exclusive.has(requiredExclusivePath)) {
    throw new Error(`Register Material escaped exclusive scope: ${requiredExclusivePath}`);
  }
}

const sourceProfile = await readFile(join(root, "profiles/relational-systems.profile.json"), "utf8");
const builtProfile = await readFile(join(root, "dist/profiles/relational-systems.profile.json"), "utf8");
if (sourceProfile !== builtProfile) {
  throw new Error("Compiled register copy differs from its exclusively scoped source");
}

const licenseNotice = await readFile(join(root, "LICENSE.md"), "utf8");
const proprietaryTerms = await readFile(join(root, "LICENSES/Hayden-Proprietary-1.1.md"), "utf8");
const historicalProprietaryTerms = await readFile(join(root, "LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md"), "utf8");
const registerTerms = await readFile(join(root, "REGISTER-LICENSE.md"), "utf8");
const commercialBaseline = await readFile(join(root, "COMMERCIAL_BASELINE.md"), "utf8");
const licensingGuide = await readFile(join(root, "docs/licensing.md"), "utf8");
const licensingRedTeam = await readFile(join(root, "docs/license-red-team.md"), "utf8");
for (const requiredPhrase of [
  "proprietary, source-available, not open source",
  "Hayden Howard Proprietary Product and Source License 1.1",
  "Lattice Exclusive Register License 1.0",
  "Permissions validly attached to earlier distributed copies remain governed by",
  "do not automatically attach to later copies or snapshots"
]) {
  if (!licenseNotice.includes(requiredPhrase)) {
    throw new Error(`License notice is missing required classification: ${requiredPhrase}`);
  }
}
for (const requiredPhrase of [
  "SPDX-License-Identifier: LicenseRef-Hayden-Proprietary-1.1",
  "There is no automatic exception for personal, noncommercial, educational",
  "machine-learning model",
  "Permissions validly attached to earlier distributed copies remain governed by"
]) {
  if (!proprietaryTerms.includes(requiredPhrase)) {
    throw new Error(`Proprietary engine terms omit required boundary: ${requiredPhrase}`);
  }
}
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
if (sha256(proprietaryTerms) !== "07b7734eb4da7c79ffdd32d4641ab64eea1922e8149ebf50c430e5f54657628c") {
  throw new Error("Current proprietary engine terms differ from the approved canonical 1.1 text");
}
if (sha256(historicalProprietaryTerms) !== "96a6fabf9ffab04c40ef27c8358acbb3da69c1ec979adbadf36c6d7988d278dc") {
  throw new Error("Historical proprietary 1.0 evidence changed");
}
for (const prohibitedPathway of [
  "Functional use",
  "train, fine-tune, align, distill, evaluate, benchmark, retrieve for, prompt",
  "No commercial use is permitted",
  "Statutory rights"
]) {
  if (!registerTerms.includes(prohibitedPathway)) {
    throw new Error(`Exclusive register terms omit required pathway: ${prohibitedPathway}`);
  }
}
if (!licensingGuide.includes("access control and private distribution are stronger controls")) {
  throw new Error("Licensing guide must disclose the source-exposure limitation");
}
for (const requiredPhrase of [
  "# COMMERCIAL BASELINE",
  "Parent: `029ca14570b3ebe5703f504ab4b4baed90883f84`",
  "First source-available code commit: `7d1d980fa92cf0591dacac06f98391b23e93e9f4`",
  "No OSI-approved product-code predecessor exists in this repository history",
  "This baseline does not revoke, narrow, or rewrite permissions",
  "## Successor policy record — 2026-09-23 UTC",
  "current Engine Materials on `LicenseRef-Hayden-Proprietary-1.1`",
  "`LICENSES/HISTORICAL/Hayden-Proprietary-1.0.md` solely as historical evidence"
]) {
  if (!commercialBaseline.includes(requiredPhrase)) {
    throw new Error(`Commercial baseline omits required evidence: ${requiredPhrase}`);
  }
}
if (!licensingRedTeam.includes("Preserved pre-baseline findings")) {
  throw new Error("Licensing red-team evidence must preserve superseded PolyForm findings");
}
for (let index = 1; index <= 18; index += 1) {
  const scenarioId = `LRE-LRT-${String(index).padStart(3, "0")}`;
  if (!licensingRedTeam.includes(scenarioId)) {
    throw new Error(`Licensing red-team evidence is missing ${scenarioId}`);
  }
}
console.log("Lattice package checks passed.");
