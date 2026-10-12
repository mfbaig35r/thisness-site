// Pull the documents that live in the thisness repo (design docs, vision, changelog) into
// content/upstream, so the site renders them rather than copies of them.
//
//   THISNESS_REPO=../thisness node scripts/sync-upstream.mjs   # a local checkout
//   node scripts/sync-upstream.mjs                             # GitHub, at THISNESS_REF
//
// THISNESS_REF defaults to the release the site documents.
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

export const REF = process.env.THISNESS_REF ?? "v0.1.0";
const REPO = process.env.THISNESS_REPO;
const RAW = `https://raw.githubusercontent.com/mfbaig35r/thisness/${REF}`;
const OUT = "content/upstream";

const FILES = [
  "CHANGELOG.md",
  "docs/vision.md",
  "docs/design/01-resolution-runs.md",
  "docs/design/02-core-model-and-storage.md",
  "docs/design/03-resolution-pipeline.md",
  "docs/design/04-m2-review-dossier-workbench-person.md",
  "docs/design/05-m3-llm-layer.md",
  "docs/design/06-m4-taxonomy.md",
  "docs/design/07-m5-real-organizations.md",
];

async function read(path) {
  if (REPO) return readFile(join(REPO, path), "utf8");
  const res = await fetch(`${RAW}/${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status} from ${RAW}`);
  return res.text();
}

await rm(OUT, { recursive: true, force: true });
for (const path of FILES) {
  const text = await read(path);
  const dest = join(OUT, path);
  await mkdir(join(dest, ".."), { recursive: true });
  await writeFile(dest, text);
}
await writeFile(join(OUT, "ref.json"), JSON.stringify({ ref: REF, from: REPO ?? RAW }) + "\n");
console.log(`synced ${FILES.length} files from ${REPO ?? RAW}`);
