/**
 * Verify every entry in the A–Z directory (`DIRECTORY_GAMES`).
 *
 * Why this matters more than it looks: the pricing layer derives a game's Steam app
 * id FROM ITS IMAGE URL (`.../steam/apps/1086940/...`) and treats the result as a
 * trusted mapping — no fuzzy search, no second opinion. So an entry whose image
 * belongs to a different game will confidently show that other game's price, and
 * nothing downstream can catch it.
 *
 * This script closes that loop: for each entry it takes the app id the image implies,
 * asks Steam what that app id ACTUALLY is, and compares it to the title we wrote.
 *
 * Read-only. Touches nothing: no files written, no code changed, Steam's public
 * appdetails endpoint only.
 *
 *   npm run verify:games
 */

import { DIRECTORY_GAMES } from "../src/lib/curated/home-picks";
import { titleMatchQuality, VERIFIED_TITLE_MATCH_MIN } from "../src/lib/title-match";

const STEAM_APP_ID_FROM_CDN_IMAGE = /steam\/apps\/(\d+)\//;

type Verdict =
  | { kind: "ok"; appId: number; steamName: string; score: number }
  | { kind: "mismatch"; appId: number; steamName: string; score: number }
  | { kind: "dead-app-id"; appId: number }
  | { kind: "no-app-id" }
  | { kind: "steam-error"; appId: number; detail: string };

type Row = { title: string; image: string; verdict: Verdict };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Steam's public store API. No key, but it rate-limits hard (429) and throws the odd
 * 500, and both come back fine on a retry — so a transient block must never be
 * reported as "unverified". Backs off and tries again rather than giving up.
 */
async function steamName(appId: number): Promise<{ name: string } | { error: string } | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic&l=en`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });

      if (res.status === 429 || res.status >= 500) {
        // 5s, 10s, 20s, 40s — Steam's block lifts on the order of tens of seconds.
        await sleep(5000 * 2 ** attempt);
        continue;
      }
      if (!res.ok) return { error: `HTTP ${res.status}` };

      const body = (await res.json()) as Record<
        string,
        { success?: boolean; data?: { name?: string } }
      >;
      const entry = body[String(appId)];

      // success:false means the app id resolves to nothing on Steam any more.
      if (!entry?.success || !entry.data?.name) return null;
      return { name: entry.data.name };
    } catch (error) {
      if (attempt === 4) {
        return { error: error instanceof Error ? error.message : "fetch failed" };
      }
      await sleep(5000 * 2 ** attempt);
    }
  }

  return { error: "rate-limited after 5 attempts" };
}

async function verify(game: (typeof DIRECTORY_GAMES)[number]): Promise<Row> {
  const match = game.image.match(STEAM_APP_ID_FROM_CDN_IMAGE);

  // Not a Steam header (a few entries use RAWG art). No app id is derived from these,
  // so pricing falls back to CheapShark/RAWG — correct by construction, nothing to check.
  if (!match) return { title: game.title, image: game.image, verdict: { kind: "no-app-id" } };

  const appId = Number(match[1]);
  const result = await steamName(appId);

  if (result === null) {
    return { title: game.title, image: game.image, verdict: { kind: "dead-app-id", appId } };
  }
  if ("error" in result) {
    return {
      title: game.title,
      image: game.image,
      verdict: { kind: "steam-error", appId, detail: result.error },
    };
  }

  const score = titleMatchQuality(game.title, result.name);
  const kind = score >= VERIFIED_TITLE_MATCH_MIN ? "ok" : "mismatch";

  return {
    title: game.title,
    image: game.image,
    verdict: { kind, appId, steamName: result.name, score },
  };
}

const rows: Row[] = [];

console.log("");
console.log(`  Verifying ${DIRECTORY_GAMES.length} directory entries against Steam…`);
console.log("");

for (const [i, game] of DIRECTORY_GAMES.entries()) {
  rows.push(await verify(game));

  // Steam throttles bursts, and a few hundred entries is enough to trip it. This is
  // maintenance, run by hand: it can afford to be slow and get a clean answer.
  await sleep(350);
  if (i % 50 === 49) console.log(`    …${i + 1}/${DIRECTORY_GAMES.length}`);
}

const by = (kind: Verdict["kind"]) => rows.filter((r) => r.verdict.kind === kind);

const ok = by("ok");
const mismatch = by("mismatch");
const dead = by("dead-app-id");
const noId = by("no-app-id");
const errored = by("steam-error");

console.log("  ─────────────────────────────────────────────");
console.log("  Verified against Steam :", ok.length);
console.log("  WRONG APP ID           :", mismatch.length);
console.log("  Dead app id            :", dead.length);
console.log("  No Steam image         :", noId.length);
console.log("  Steam unreachable      :", errored.length);
console.log("  ─────────────────────────────────────────────");
console.log("");

if (mismatch.length > 0) {
  console.log("  WRONG APP ID — these entries will show ANOTHER GAME'S PRICE:");
  console.log("");
  for (const r of mismatch) {
    const v = r.verdict as Extract<Verdict, { kind: "mismatch" }>;
    console.log(`    ${r.title}`);
    console.log(`      image says app ${v.appId}, which Steam calls "${v.steamName}"`);
    console.log(`      title match ${v.score.toFixed(2)} (needs ≥ ${VERIFIED_TITLE_MATCH_MIN})`);
    console.log("");
  }
}

if (dead.length > 0) {
  console.log("  DEAD APP ID — Steam no longer knows this app (delisted? wrong id?):");
  for (const r of dead) {
    const v = r.verdict as Extract<Verdict, { kind: "dead-app-id" }>;
    console.log(`    ${r.title.padEnd(44)} app ${v.appId}`);
  }
  console.log("");
}

if (noId.length > 0) {
  console.log("  NO STEAM IMAGE — fine, but pricing has no trusted id to fall back on:");
  for (const r of noId) console.log(`    ${r.title}`);
  console.log("");
}

if (errored.length > 0) {
  console.log("  STEAM UNREACHABLE — re-run; these were NOT checked:");
  for (const r of errored) {
    const v = r.verdict as Extract<Verdict, { kind: "steam-error" }>;
    console.log(`    ${r.title.padEnd(44)} ${v.detail}`);
  }
  console.log("");
}

console.log("  Report only — nothing was changed.");
console.log("");
