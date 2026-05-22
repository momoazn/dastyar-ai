import { existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { $ } from "bun";

const projectName = "dastyar-ai";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const releaseDir = "release";
const stagingDir = join(releaseDir, `${projectName}-source-${timestamp}`);
const archivePath = `${stagingDir}.zip`;

const excludedPrefixes = [
  "dist/",
  "node_modules/",
  "apps/server/dist/",
  "apps/web/dist/",
  "apps/server/generated-images/",
  "apps/server/uploaded-documents/",
  "apps/whisper/.go-work/",
  "apps/whisper/models/",
  "apps/whisper/temp/",
  "apps/whisper/whisper.cpp/",
  "release/",
];

function shouldInclude(path: string): boolean {
  return !excludedPrefixes.some((prefix) => path.startsWith(prefix));
}

mkdirSync(releaseDir, { recursive: true });
rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(stagingDir, { recursive: true });

const tracked = (
  await $`git ls-files --cached --others --exclude-standard`.text()
)
  .split("\n")
  .filter(Boolean)
  .filter(shouldInclude)
  .filter(existsSync);

for (const file of tracked) {
  const destination = join(stagingDir, file);
  await $`mkdir -p ${dirname(destination)}`;
  await $`cp ${file} ${destination}`;
}

await $`cd ${releaseDir} && zip -qr ${basename(archivePath)} ${basename(stagingDir)}`;

console.log(`Created ${archivePath}`);
console.log(`Included ${tracked.length} tracked source files`);
