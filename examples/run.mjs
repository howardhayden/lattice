import { readdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createEngine, verifyResult } from "../dist/index.js";

const exampleDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(exampleDirectory);
const argumentsProvided = process.argv.slice(2);
const locations = argumentsProvided.length
  ? argumentsProvided.map((entry) => isAbsolute(entry) ? entry : resolve(process.cwd(), entry))
  : (await readdir(exampleDirectory))
    .filter((entry) => entry.endsWith(".request.json"))
    .sort()
    .map((entry) => join(exampleDirectory, entry));

const engine = createEngine();
const summaries = [];

for (const location of locations) {
  const request = JSON.parse(await readFile(location, "utf8"));
  const result = engine.realize(request);
  verifyResult(result);
  summaries.push({
    example: relative(packageRoot, location),
    requestId: result.requestId,
    conformance: result.conformance,
    outputs: result.outputs.map((output) => ({
      key: output.key,
      candidateId: output.candidateId,
      conformance: output.conformance,
      text: output.text
    })),
    receiptVerified: true
  });
}

process.stdout.write(`${JSON.stringify(summaries, null, 2)}\n`);
