import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  canUseSteamImport,
  isSteamImportAdminOnly,
  isSteamImportEnabled,
} from "@/lib/steam-library/access-flags";

const originalEnabled = process.env.STEAM_IMPORT_ENABLED;
const originalAdminOnly = process.env.STEAM_IMPORT_ADMIN_ONLY;

afterEach(() => {
  if (originalEnabled === undefined) delete process.env.STEAM_IMPORT_ENABLED;
  else process.env.STEAM_IMPORT_ENABLED = originalEnabled;
  if (originalAdminOnly === undefined) delete process.env.STEAM_IMPORT_ADMIN_ONLY;
  else process.env.STEAM_IMPORT_ADMIN_ONLY = originalAdminOnly;
});

describe("steam import feature flags", () => {
  it("is disabled by default", () => {
    delete process.env.STEAM_IMPORT_ENABLED;
    assert.equal(isSteamImportEnabled(), false);
    assert.equal(canUseSteamImport("admin"), false);
  });

  it("allows admin only when configured", () => {
    process.env.STEAM_IMPORT_ENABLED = "true";
    process.env.STEAM_IMPORT_ADMIN_ONLY = "true";
    assert.equal(isSteamImportEnabled(), true);
    assert.equal(isSteamImportAdminOnly(), true);
    assert.equal(canUseSteamImport("admin"), true);
    assert.equal(canUseSteamImport("premium"), false);
    assert.equal(canUseSteamImport("free"), false);
  });

  it("allows all plans when admin-only is false", () => {
    process.env.STEAM_IMPORT_ENABLED = "1";
    process.env.STEAM_IMPORT_ADMIN_ONLY = "false";
    assert.equal(canUseSteamImport("free"), true);
    assert.equal(canUseSteamImport("premium"), true);
  });
});
