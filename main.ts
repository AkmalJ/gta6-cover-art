// Vice Panels — hand-in program for the gta6-cover-art-01 bounty (Node 22, standard library only).
//
// The entry itself is the static web app in app/: plain files a desktop browser runs offline, no
// build step and no network calls. This program packages it for the judge — it copies app/ and
// screenshots/ into the output directory and writes dossier.json there with the vendored make.fun
// library. Before it writes anything it checks the hand-in is complete: the app entry point must
// exist and every screenshot named in shots.json must be on disk and inside the size cap, so a
// broken package fails here instead of in front of the judge.
//
// Try the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SHOT_CAP = 262144; // 256 KiB per screenshot, the scorer's own limit

// --- Completeness check: name what is missing rather than handing in a hollow package. ---
const problems: string[] = [];
if (!existsSync(join(here, 'app', 'index.html'))) problems.push('app/index.html is missing');
const shotPlan: { name: string }[] = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const shotFacts: string[] = [];
for (const shot of shotPlan) {
  const file = join(here, 'screenshots', shot.name);
  if (!existsSync(file)) {
    problems.push(`screenshots/${shot.name} is missing`);
  } else {
    const bytes = statSync(file).size;
    if (bytes > SHOT_CAP) problems.push(`screenshots/${shot.name} is ${bytes} bytes, over the ${SHOT_CAP} cap`);
    shotFacts.push(`${shot.name} ${(bytes / 1024).toFixed(0)}KiB`);
  }
}
if (problems.length) throw new Error(`hand-in incomplete: ${problems.join('; ')}`);

// --- Package: app and screenshots beside a fresh dossier. ---
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps, mirrored from the kit's gate so this program refuses only what it would.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: SHOT_CAP },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Vice Panels handed in: app/ + ${shotFacts.length} screenshots (${shotFacts.join(', ')}) + dossier.json -> ${out}`);
