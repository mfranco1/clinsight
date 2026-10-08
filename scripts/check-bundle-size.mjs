import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const assetsDir = path.resolve("dist/assets");
const warningLimitBytes = 500_000;
const assetNames = await readdir(assetsDir);
const jsAssets = assetNames.filter((name) => name.endsWith(".js"));
const chunks = await Promise.all(
  jsAssets.map(async (name) => ({
    name,
    bytes: (await stat(path.join(assetsDir, name))).size,
    gzipBytes: gzipSync(await readFile(path.join(assetsDir, name))).length,
  })),
);
chunks.sort((a, b) => b.bytes - a.bytes);

if (chunks.length === 0) {
  console.error("No JavaScript chunks found in dist/assets.");
  process.exitCode = 1;
} else {
  for (const chunk of chunks) {
    const status = chunk.bytes >= warningLimitBytes ? "OVER LIMIT" : "ok";
    console.log(
      `${status.padEnd(10)} ${(chunk.bytes / 1_000).toFixed(2)} kB  ${chunk.name}`,
    );
  }
  const largest = chunks[0];
  const totalBytes = chunks.reduce((total, chunk) => total + chunk.bytes, 0);
  const totalGzipBytes = chunks.reduce(
    (total, chunk) => total + chunk.gzipBytes,
    0,
  );
  const indexHtml = await readFile(path.resolve("dist/index.html"), "utf8");
  const startupAssets = [
    ...indexHtml.matchAll(/(?:src|href)="([^"]+\.js)"/g),
  ].map((match) => path.basename(match[1]));
  const startupChunks = chunks.filter((chunk) =>
    startupAssets.includes(chunk.name),
  );
  const startupBytes = startupChunks.reduce(
    (total, chunk) => total + chunk.bytes,
    0,
  );
  const startupGzipBytes = startupChunks.reduce(
    (total, chunk) => total + chunk.gzipBytes,
    0,
  );
  console.log(
    `Startup JavaScript: ${(startupBytes / 1_000).toFixed(2)} kB / ${(startupGzipBytes / 1_000).toFixed(2)} kB gzip (${startupChunks.length} entry/preload chunks).`,
  );
  console.log(
    `Total JavaScript: ${(totalBytes / 1_000).toFixed(2)} kB / ${(totalGzipBytes / 1_000).toFixed(2)} kB summed gzip; largest: ${(largest.bytes / 1_000).toFixed(2)} kB (limit: ${warningLimitBytes / 1_000} kB).`,
  );
  if (chunks.some((chunk) => chunk.bytes >= warningLimitBytes)) {
    process.exitCode = 1;
  }
}
