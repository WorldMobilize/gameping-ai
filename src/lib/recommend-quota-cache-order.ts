/**
 * Documented handler order for POST /api/recommend (quota vs cache).
 *
 * 1. Validate body + prompt length
 * 2. Build early cache key (user-visible inputs only)
 * 3. getCachedAiRecommendation(earlyHash) — best-effort; null on read failure
 * 4. On early cache hit → return cached JSON (no tryConsumeRecommendDailySlot)
 * 5. On miss → tryConsumeRecommendDailySlot (unless admin / RECOMMEND_DEV_BYPASS)
 * 6. If quota denied → 429
 * 7. Run generation pipeline; optional full-hash cache after intent exists
 * 8. Write early + full cache rows on success
 *
 * Cached responses do not consume a daily recommendation slot.
 */
export const RECOMMEND_QUOTA_AFTER_EARLY_CACHE_LOOKUP = true as const;
