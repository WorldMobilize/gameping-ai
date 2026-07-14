/**
 * "No ghost games" check.
 *
 * Every game we name inside a curated collection should also exist in the A–Z
 * directory (`DIRECTORY_GAMES`). Being outside it does NOT break the game's detail
 * page — that page resolves the title against RAWG, and pricing finds its Steam app
 * id from CheapShark or RAWG's store links long before it ever consults the
 * directory. What a game outside the directory actually loses is:
 *
 *   - its entry in the A–Z list,
 *   - its URL in the sitemap (so Google only ever reaches it via internal links),
 *   - its OG image fallback when the page is shared,
 *   - a last-resort Steam app id if both CheapShark and RAWG come up empty.
 *
 * So this is a REPORT, not a gate: it prints the gap and always exits 0. Closing the
 * gap means adding entries to home-picks.ts, and that file feeds the pricing layer's
 * trusted title → Steam-app-id map — a wrong image there makes a game display another
 * game's price, with no fallback to catch it. Add in verified batches, never in bulk.
 *
 *   npm run check:games
 */

import { CURATED_COLLECTIONS } from "../src/lib/curated/collections";
import { DIRECTORY_GAMES } from "../src/lib/curated/home-picks";

/** Same normalisation the pricing and SEO layers use to match a title. */
const key = (title: string) => title.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const directory = new Map(DIRECTORY_GAMES.map((g) => [key(g.title), g.title]));

/** Every game named in a collection, and which collections name it. */
const referenced = new Map<string, { title: string; collections: string[] }>();

for (const collection of CURATED_COLLECTIONS) {
  for (const game of collection.games) {
    const k = key(game.title);
    const entry = referenced.get(k) ?? { title: game.title, collections: [] };
    entry.collections.push(collection.slug);
    referenced.set(k, entry);
  }
}

const missing = [...referenced.entries()]
  .filter(([k]) => !directory.has(k))
  .map(([, v]) => v)
  .sort((a, b) => b.collections.length - a.collections.length || a.title.localeCompare(b.title));

const covered = referenced.size - missing.length;

console.log("");
console.log("  Games named in collections :", referenced.size);
console.log("  Games in the A–Z directory :", directory.size);
console.log("  Covered by the directory   :", covered);
console.log("  MISSING from the directory :", missing.length);
console.log("");

if (missing.length === 0) {
  console.log("  No ghost games. Every game in a collection is in the directory.");
  console.log("");
  process.exit(0);
}

/* Most-referenced first: a game five collections point at is worth adding before one
   that a single list mentions once. */
console.log("  Missing, most-referenced first — add these to the directory in batches:");
console.log("");

for (const game of missing) {
  const n = game.collections.length;
  const where = n === 1 ? game.collections[0] : `${n} collections`;
  console.log(`    ${game.title.padEnd(48)} ${where}`);
}

console.log("");
console.log("  Report only — this never fails the build.");
console.log("");
