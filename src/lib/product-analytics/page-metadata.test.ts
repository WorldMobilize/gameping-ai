import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPageViewMetadataFromContext,
  buildSessionStartMetadataFromContext,
} from "./page-metadata";
import { sanitizeProductAnalyticsMetadata } from "./sanitize";

describe("page metadata builders", () => {
  const ctx = {
    pathname: "/recommend",
    href: "https://gamepingai.com/recommend?utm_source=tiktok",
    search: "?utm_source=tiktok",
    referrer: "https://www.tiktok.com/",
  };

  it("buildPageViewMetadataFromContext includes path, full_url, search, referrer", () => {
    const meta = buildPageViewMetadataFromContext(ctx);
    assert.equal(meta.path, "/recommend");
    assert.equal(meta.full_url, ctx.href);
    assert.equal(meta.search, "?utm_source=tiktok");
    assert.equal(meta.referrer, "https://www.tiktok.com/");
  });

  it("buildSessionStartMetadataFromContext includes landing fields", () => {
    const meta = buildSessionStartMetadataFromContext({
      ...ctx,
      pathname: "/",
      href: "https://gamepingai.com/",
      search: "",
    });
    assert.equal(meta.landing_path, "/");
    assert.equal(meta.landing_url, "https://gamepingai.com/");
    assert.equal(meta.referrer, "https://www.tiktok.com/");
  });

  it("sanitized page_view metadata keeps path for funnel SQL", () => {
    const home = sanitizeProductAnalyticsMetadata(
      buildPageViewMetadataFromContext({
        pathname: "/",
        href: "https://gamepingai.com/",
        search: "",
        referrer: "",
      })
    );
    assert.equal(home.path, "/");

    const recommend = sanitizeProductAnalyticsMetadata(
      buildPageViewMetadataFromContext(ctx)
    );
    assert.equal(recommend.path, "/recommend");
    assert.equal(recommend.referrer, "https://www.tiktok.com/");
  });
});
