import "server-only";

import { isLowQualityTitle, type RawgCandidate } from "@/lib/rawg-discovery";

/**
 * Candidate quality gate for the premium personalization generators.
 *
 * RAWG search returns a lot of prototype / demo / shovelware noise alongside real
 * games — e.g. "Exploration (Alpha 1.0)", "Exploration-087", "Exploration 01:
 * Game Engines (rianabana)". None of that is acceptable as a premium pick. This
 * module is the FINAL gate before a candidate can be shown: it rejects suspicious
 * names, requires a credible popularity signal, removes near-duplicate title
 * clusters, and excludes games the user already owns.
 *
 * The bar is intentionally strict — better to surface 3 excellent picks than 8
 * filler ones. Generators that can't clear MIN_CREDIBLE_PICKS should fail into a
 * useful empty state rather than show low-quality results.
 */

/** Minimum number of credible picks worth showing; below this → empty state. */
export const MIN_CREDIBLE_PICKS = 3;

// Suspicious / non-shippable title markers (case-insensitive, tested on the raw
// title). Catches prototypes, demos, versioned dumps, engine tests, and id-like
// numeric junk that RAWG search surfaces.
const SUSPICIOUS_TITLE_PATTERNS: RegExp[] = [
  /\balpha\b/i,
  /\balpah\b/i, // common misspelling seen in shovelware
  /\bbeta\b/i,
  /\bprototype\b/i,
  /\bproto\b/i,
  /\bdemo\b/i,
  /\btest\b/i,
  /\bwip\b/i,
  /\bunfinished\b/i,
  /\bplaceholder\b/i,
  /\buntitled\b/i,
  /\bgame\s*engines?\b/i,
  /\bgame\s*jam\b/i,
  /\bgame\s*template\b/i,
  /\bsandbox\s*test\b/i,
  /\bmy\s*(first|new)\s*game\b/i,
  /\blite\b/i,
  /\bv?\d+\.\d+(\.\d+)?\b/, // version numbers: 1.0, v1.1, 0.9.2
  /\b\d{2,5}\b/, // id-like standalone numbers: 01, 087, 2024
  /[-_]\s*\d+\b/, // trailing id: -087, _01
];

const CLUSTER_STOPWORDS = new Set(["the", "a", "an", "of", "and", "to", "my"]);

export function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

/** True when the title looks like a prototype / demo / test / versioned dump. */
export function isSuspiciousTitle(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  // Mostly-symbols or single-character titles are not real games.
  if (n.replace(/[^a-zA-Z0-9]/g, "").length < 2) return true;
  return SUSPICIOUS_TITLE_PATTERNS.some((re) => re.test(n));
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function candidateImage(c: RawgCandidate): string | null {
  return c.background_image || c.image_fallback || null;
}

/**
 * A credible popularity/quality signal — a real, played game has at least some
 * ratings or library adds. The shovelware noise has near-zero of both.
 */
export function hasCredibleSignal(c: RawgCandidate): boolean {
  const ratingsCount = num(c.ratings_count);
  const added = num(c.added);
  const reviews = num(c.reviews_count);
  return ratingsCount >= 10 || added >= 300 || reviews >= 8;
}

/** Higher = more credible/popular. Used to rank within a duplicate cluster. */
function popularityScore(c: RawgCandidate): number {
  return num(c.added) + num(c.ratings_count) * 25 + num(c.reviews_count) * 5 + num(c.rating) * 50;
}

/**
 * Single-candidate credibility gate: real image, real title, credible signal,
 * acceptable rating, not suspicious, not low-quality (DLC/soundtrack/etc.), and
 * not already owned.
 */
export function isCredibleCandidate(
  c: RawgCandidate,
  ownedNorms?: Set<string>
): boolean {
  if (!c || typeof c.name !== "string" || !c.name.trim()) return false;
  if (!candidateImage(c)) return false;
  if (isLowQualityTitle(c.name)) return false;
  if (isSuspiciousTitle(c.name)) return false;
  if (!hasCredibleSignal(c)) return false;
  const rating = num(c.rating);
  if (rating > 0 && rating < 3.0) return false; // rated, but poorly
  if (ownedNorms && ownedNorms.has(normalizeForMatch(c.name))) return false;
  return true;
}

/** Cluster key = first significant word — collapses "Exploration ..." spam and
 * over-represented franchises into a single best entry. */
function clusterKey(name: string): string {
  const words = normalizeForMatch(name)
    .split(" ")
    .filter((w) => w && !CLUSTER_STOPWORDS.has(w));
  return words[0] ?? normalizeForMatch(name);
}

/**
 * Filter to credible candidates, then keep only the most credible entry per
 * title cluster (kills duplicate spam + improves diversity). Returns
 * best-first, optionally truncated to `limit`.
 */
export function selectCredibleCandidates(
  candidates: RawgCandidate[],
  opts: { ownedNorms?: Set<string>; limit?: number } = {}
): RawgCandidate[] {
  const credible = candidates
    .filter((c) => isCredibleCandidate(c, opts.ownedNorms))
    .sort((a, b) => popularityScore(b) - popularityScore(a));

  const seenCluster = new Set<string>();
  const out: RawgCandidate[] = [];
  for (const c of credible) {
    const key = clusterKey(c.name);
    if (seenCluster.has(key)) continue;
    seenCluster.add(key);
    out.push(c);
    if (opts.limit && out.length >= opts.limit) break;
  }
  return out;
}
