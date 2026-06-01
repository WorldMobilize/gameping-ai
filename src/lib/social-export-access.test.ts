import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { canShowSocialExport } from "@/lib/social-export-access"

const originalNodeEnv = process.env.NODE_ENV
const originalPublicFlag = process.env.NEXT_PUBLIC_SOCIAL_EXPORT_ENABLED

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
  if (originalPublicFlag === undefined) {
    delete process.env.NEXT_PUBLIC_SOCIAL_EXPORT_ENABLED
  } else {
    process.env.NEXT_PUBLIC_SOCIAL_EXPORT_ENABLED = originalPublicFlag
  }
})

describe("canShowSocialExport", () => {
  it("allows all plans in development", () => {
    process.env.NODE_ENV = "development"
    assert.equal(canShowSocialExport(null), true)
    assert.equal(canShowSocialExport("free"), true)
    assert.equal(canShowSocialExport("premium"), true)
    assert.equal(canShowSocialExport("admin"), true)
  })

  it("denies anonymous, free, and premium in production", () => {
    process.env.NODE_ENV = "production"
    assert.equal(canShowSocialExport(null), false)
    assert.equal(canShowSocialExport(undefined), false)
    assert.equal(canShowSocialExport("free"), false)
    assert.equal(canShowSocialExport("premium"), false)
  })

  it("allows admin only in production", () => {
    process.env.NODE_ENV = "production"
    assert.equal(canShowSocialExport("admin"), true)
  })

  it("ignores NEXT_PUBLIC_SOCIAL_EXPORT_ENABLED in production", () => {
    process.env.NODE_ENV = "production"
    process.env.NEXT_PUBLIC_SOCIAL_EXPORT_ENABLED = "1"
    assert.equal(canShowSocialExport(null), false)
    assert.equal(canShowSocialExport("free"), false)
    assert.equal(canShowSocialExport("premium"), false)
  })
})
