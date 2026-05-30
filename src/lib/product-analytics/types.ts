export const PRODUCT_ANALYTICS_EVENTS = [
  "session_start",
  "session_end",
  "session_heartbeat",
  "page_view",
  "recommend_started",
  "recommend_completed",
  "recommend_failed",
  "game_viewed",
  "store_clicked",
  "feedback_submitted",
  "signup_completed",
] as const;

export type ProductAnalyticsEventName = (typeof PRODUCT_ANALYTICS_EVENTS)[number];

export type ProductAnalyticsMetadata = Record<
  string,
  string | number | boolean | null
>;

export type ProductAnalyticsEventInput = {
  event_name: ProductAnalyticsEventName;
  session_id: string;
  anonymous_id?: string | null;
  page_path?: string | null;
  referrer?: string | null;
  metadata?: ProductAnalyticsMetadata;
};
