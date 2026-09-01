import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "src");
const output = join(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

async function copyTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const input = join(directory, entry.name);
    const rel = relative(source, input);
    if (entry.isDirectory()) {
      await mkdir(join(output, rel), { recursive: true });
      await copyTree(input);
      continue;
    }
    if (extname(entry.name) !== ".ts") continue;
    const target = join(output, rel.replace(/\.ts$/u, ".js"));
    await mkdir(dirname(target), { recursive: true });
    const text = (await readFile(input, "utf8"))
      .replace(/from\s+(["'])(\.\.?\/[^"']+)\.ts\1/gu, "from $1$2.js$1")
      .replace(/import\s+(["'])(\.\.?\/[^"']+)\.ts\1/gu, "import $1$2.js$1");
    await writeFile(target, text, "utf8");
  }
}

await copyTree(source);
await cp(join(root, "profiles"), join(output, "profiles"), { recursive: true });
