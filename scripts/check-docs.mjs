import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requiredFiles = [
  "AGENTS.md",
  "DESIGN.md",
  "README.md",
  "docs/README.md",
  "docs/architecture.md",
  "docs/design-system.md",
  "docs/development.md",
  "docs/testing.md",
  "docs/product.md",
  "docs/data-and-persistence.md",
  "docs/ai-integration.md",
  "docs/operations.md",
  "docs/work/README.md",
];

const taskDirectories = ["docs/work/ongoing", "docs/work/done"];
const ongoingStatuses = new Set(["planned", "active", "blocked"]);
const doneStatuses = new Set(["done", "cancelled", "superseded"]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "dist-ssr",
  "coverage",
  "playwright-report",
  "test-results",
]);

async function walkMarkdown(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkMarkdown(fullPath)));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files;
}

export async function checkDocs(root) {
  const errors = [];
  for (const file of requiredFiles) {
    try {
      if (!(await stat(path.join(root, file))).isFile())
        errors.push(`Required path is not a file: ${file}`);
    } catch {
      errors.push(`Missing required file: ${file}`);
    }
  }

  for (const directory of taskDirectories) {
    try {
      if (!(await stat(path.join(root, directory))).isDirectory())
        errors.push(`Required path is not a directory: ${directory}`);
    } catch {
      errors.push(`Missing required directory: ${directory}`);
    }
  }

  const markdownFiles = await walkMarkdown(root);
  for (const file of markdownFiles) {
    const source = await readFile(file, "utf8");
    const relativeSource = path.relative(root, file);

    for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const destination = match[1].trim().replace(/^<|>$/g, "");
      if (
        !destination ||
        /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination) ||
        destination.startsWith("#")
      )
        continue;
      const pathname = decodeURIComponent(destination.split(/[?#]/, 1)[0]);
      if (!pathname) continue;
      const resolved = path.resolve(path.dirname(file), pathname);
      const relativeTarget = path.relative(root, resolved);
      if (relativeTarget.startsWith(`..${path.sep}`) || relativeTarget === "..")
        continue;
      try {
        await stat(resolved);
      } catch {
        errors.push(`Broken local link in ${relativeSource}: ${destination}`);
      }
    }

    if (
      relativeSource.startsWith("docs/work/ongoing/") ||
      relativeSource.startsWith("docs/work/done/")
    ) {
      const status = source
        .match(
          /^Status:\s*(planned|active|blocked|done|cancelled|superseded)\s*$/im,
        )?.[1]
        ?.toLowerCase();
      const inOngoing = relativeSource.startsWith("docs/work/ongoing/");
      const allowed = inOngoing ? ongoingStatuses : doneStatuses;
      if (!status)
        errors.push(`Missing or invalid task status in ${relativeSource}`);
      else if (!allowed.has(status))
        errors.push(
          `Task status '${status}' is in the wrong directory: ${relativeSource}`,
        );
    }
  }

  return errors;
}

async function runSelfTest() {
  const { mkdtemp, mkdir, rm, writeFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const fixture = await mkdtemp(path.join(tmpdir(), "clinsight-docs-check-"));
  try {
    for (const file of requiredFiles) {
      const fullPath = path.join(fixture, file);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, "# Fixture\n");
    }
    for (const directory of taskDirectories)
      await mkdir(path.join(fixture, directory), { recursive: true });
    await writeFile(
      path.join(fixture, "docs/work/ongoing/task.md"),
      "Status: active\n[good](../README.md)\n",
    );
    await writeFile(
      path.join(fixture, "docs/work/done/old.md"),
      "Status: done\n",
    );
    const validErrors = await checkDocs(fixture);
    if (validErrors.length)
      throw new Error(`Valid fixture failed: ${validErrors.join("; ")}`);

    await writeFile(
      path.join(fixture, "docs/work/ongoing/task.md"),
      "Status: done\n[missing](../absent.md)\n",
    );
    const invalidErrors = await checkDocs(fixture);
    if (!invalidErrors.some((error) => error.includes("wrong directory")))
      throw new Error("Self-test did not detect a mismatched task status");
    if (!invalidErrors.some((error) => error.includes("Broken local link")))
      throw new Error("Self-test did not detect a broken local link");
    await rm(path.join(fixture, "DESIGN.md"));
    const missingErrors = await checkDocs(fixture);
    if (
      !missingErrors.some((error) =>
        error.includes("Missing required file: DESIGN.md"),
      )
    )
      throw new Error("Self-test did not detect a missing required file");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

if (process.argv.includes("--self-test")) {
  await runSelfTest();
  console.log("Documentation checker self-test passed.");
} else {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const errors = await checkDocs(root);
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      "Documentation structure, task status, and local links are valid.",
    );
  }
}
