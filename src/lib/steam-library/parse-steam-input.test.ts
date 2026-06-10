import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSteamProfileInput } from "@/lib/steam-library/parse-steam-input";

describe("parseSteamProfileInput", () => {
  it("parses SteamID64", () => {
    const parsed = parseSteamProfileInput("76561198000000000");
    assert.equal(parsed.steamId, "76561198000000000");
    assert.match(parsed.profileUrl ?? "", /profiles\/76561198000000000/);
  });

  it("parses profiles URL", () => {
    const parsed = parseSteamProfileInput(
      "https://steamcommunity.com/profiles/76561198012345678/"
    );
    assert.equal(parsed.steamId, "76561198012345678");
  });

  it("parses vanity URL", () => {
    const parsed = parseSteamProfileInput("https://steamcommunity.com/id/gaben");
    assert.equal(parsed.vanityUrl, "gaben");
    assert.equal(parsed.steamId, null);
  });

  it("parses bare vanity username", () => {
    const parsed = parseSteamProfileInput("my-steam-name");
    assert.equal(parsed.vanityUrl, "my-steam-name");
  });
});
