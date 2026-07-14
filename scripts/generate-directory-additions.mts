/**
 * Build the directory entries for every game a collection names but the A–Z
 * directory does not have — and refuse to emit one we cannot prove.
 *
 * For each missing game it takes the image the collection already carries, reads the
 * Steam app id out of that URL, and asks Steam what that app id ACTUALLY is. Only
 * when Steam's name matches the title we wrote does the entry get emitted; anything
 * else is listed as a reject for a human to look at.
 *
 * That gate is the whole point. `DIRECTORY_GAMES` feeds the pricing layer's trusted
 * title → app-id map: an entry carrying the wrong image makes a game display another
 * game's price, with no fallback to catch it. So no entry ships unverified.
 *
 * The `tag` line comes from the genres Steam itself publishes, not from invention.
 *
 * Writes nothing into src/. It prints the code to paste, and the rejects to review.
 *
 *   npm run generate:directory-additions
 */

import { writeFileSync } from "node:fs";
import { CURATED_COLLECTIONS } from "../src/lib/curated/collections";
import { DIRECTORY_GAMES } from "../src/lib/curated/home-picks";
import { titleMatchQuality, VERIFIED_TITLE_MATCH_MIN } from "../src/lib/title-match";

const STEAM_APP_ID_FROM_CDN_IMAGE = /steam\/apps\/(\d+)\//;
const OUT = "scripts/.directory-additions.txt";

const key = (t: string) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const inDirectory = new Set(DIRECTORY_GAMES.map((g) => key(g.title)));

/** Each missing game, with the image and the collections that name it. */
const missing = new Map<string, { title: string; image: string; refs: number }>();

for (const collection of CURATED_COLLECTIONS) {
  for (const game of collection.games) {
    const k = key(game.title);
    if (inDirectory.has(k)) continue;

    const entry = missing.get(k);
    if (entry) {
      entry.refs += 1;
    } else {
      missing.set(k, { title: game.title, image: game.image, refs: 1 });
    }
  }
}

type SteamApp = { name: string; genres: string[] };

async function steamApp(appId: number): Promise<SteamApp | { error: string } | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=en`;

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return { error: `HTTP ${res.status}` };

    const body = (await res.json()) as Record<
      string,
      {
        success?: boolean;
        data?: { name?: string; genres?: { description?: string }[] };
      }
    >;
    const entry = body[String(appId)];
    if (!entry?.success || !entry.data?.name) return null;

    return {
      name: entry.data.name,
      genres: (entry.data.genres ?? [])
        .map((g) => g.description)
        .filter((g): g is string => Boolean(g)),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "fetch failed" };
  }
}

/**
 * "Action · RPG" — the two most telling genres Steam publishes for the app.
 *
 * "Indie" is dropped when anything else is available: it describes who made a game,
 * not what playing it is like, and this line exists to tell a browsing reader what
 * the game IS.
 */
function tagFrom(genres: string[]): string | null {
  const useful = genres.filter((g) => g !== "Indie");
  const picked = (useful.length > 0 ? useful : genres).slice(0, 2);
  return picked.length > 0 ? picked.join(" · ") : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const accepted: Array<{ title: string; tag: string; appId: number; refs: number }> = [];
const rejected: Array<{ title: string; reason: string; refs: number }> = [];

const list = [...missing.values()].sort((a, b) => a.title.localeCompare(b.title));

console.log("");
console.log(`  ${list.length} games named in collections but missing from the directory.`);
console.log("  Verifying each against Steam before emitting anything…");
console.log("");

for (const [i, game] of list.entries()) {
  const match = game.image.match(STEAM_APP_ID_FROM_CDN_IMAGE);

  if (!match) {
    rejected.push({ title: game.title, reason: "image is not a Steam header", refs: game.refs });
    continue;
  }

  const appId = Number(match[1]);
  const app = await steamApp(appId);

  if (app === null) {
    rejected.push({ title: game.title, reason: `app ${appId} unknown to Steam`, refs: game.refs });
  } else if ("error" in app) {
    rejected.push({ title: game.title, reason: `Steam ${app.error} (retry)`, refs: game.refs });
  } else {
    const score = titleMatchQuality(game.title, app.name);

    if (score < VERIFIED_TITLE_MATCH_MIN) {
      rejected.push({
        title: game.title,
        reason: `app ${appId} is "${app.name}" (match ${score.toFixed(2)})`,
        refs: game.refs,
      });
    } else {
      const tag = tagFrom(app.genres);
      if (!tag) {
        rejected.push({ title: game.title, reason: `app ${appId} has no genres`, refs: game.refs });
      } else {
        accepted.push({ title: game.title, tag, appId, refs: game.refs });
      }
    }
  }

  if (i % 8 === 7) await sleep(600);
  if (i % 40 === 39) console.log(`    …${i + 1}/${list.length}`);
}

accepted.sort((a, b) => a.title.localeCompare(b.title));
rejected.sort((a, b) => b.refs - a.refs || a.title.localeCompare(b.title));

const code = accepted
  .map(
    (g) =>
      `  { title: ${JSON.stringify(g.title)}, tag: ${JSON.stringify(g.tag)}, image: steamHeaderImage(${g.appId}) },`
  )
  .join("\n");

writeFileSync(OUT, code + "\n", "utf8");

console.log("");
console.log("  ─────────────────────────────────────────────");
console.log("  Verified, ready to add :", accepted.length);
console.log("  Rejected (needs a human):", rejected.length);
console.log("  ─────────────────────────────────────────────");
console.log("");
console.log(`  Entries written to ${OUT}`);
console.log("");

if (rejected.length > 0) {
  console.log("  REJECTED — nothing was emitted for these:");
  console.log("");
  for (const r of rejected) {
    console.log(`    ${r.title.padEnd(46)} ${r.reason}`);
  }
  console.log("");
}
