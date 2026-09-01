import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = [
  "README.md",
  "LICENSE.md",
  "REGISTER-LICENSE.md",
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
  throw new Error("Package metadata must point to the split license notice");
}
if (packagePayload.private !== true) {
  throw new Error("The owner package must remain private and blocked from registry publication");
}

const scopeManifest = JSON.parse(await readFile(join(root, "license-scope.json"), "utf8"));
const expectedScopes = ["register-exclusive", "engine-noncommercial", "license-administrative"];
if (Object.keys(scopeManifest.scopes).sort().join("|") !== expectedScopes.sort().join("|")) {
  throw new Error("License scope manifest is not closed");
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
const registerTerms = await readFile(join(root, "REGISTER-LICENSE.md"), "utf8");
const licensingGuide = await readFile(join(root, "docs/licensing.md"), "utf8");
const licensingRedTeam = await readFile(join(root, "docs/license-red-team.md"), "utf8");
for (const requiredPhrase of [
  "source-available, not open source",
  "PolyForm Noncommercial License 1.0.0",
  "Lattice Exclusive Register License 1.0"
]) {
  if (!licenseNotice.includes(requiredPhrase)) {
    throw new Error(`License notice is missing required classification: ${requiredPhrase}`);
  }
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
for (let index = 1; index <= 18; index += 1) {
  const scenarioId = `LRE-LRT-${String(index).padStart(3, "0")}`;
  if (!licensingRedTeam.includes(scenarioId)) {
    throw new Error(`Licensing red-team evidence is missing ${scenarioId}`);
  }
}
console.log("Lattice package checks passed.");
