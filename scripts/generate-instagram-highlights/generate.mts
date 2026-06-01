/**
 * One-time local generator for Instagram Highlight story PNGs.
 * Run: npm run generate:instagram-highlights
 *
 * Output: exports/instagram-highlights/*.png (1080×1920)
 * Does not touch the in-app social export feature.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { HIGHLIGHT_SLIDES, renderSlideHtml } from "./slides"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "../..")
const OUT_DIR = path.join(ROOT, "exports", "instagram-highlights")
const TEMP_DIR = path.join(OUT_DIR, ".tmp-html")
const CSS_PATH = path.join(__dirname, ".highlight-bundle.css")
const CSS_INPUT = path.join(__dirname, "highlight-input.css")

async function buildHighlightCss() {
  const postcss = (await import("postcss")).default
  const tailwindcss = (await import("@tailwindcss/postcss")).default
  const input = await readFile(CSS_INPUT, "utf8")
  const result = await postcss([tailwindcss()]).process(input, { from: CSS_INPUT })
  await writeFile(CSS_PATH, result.css, "utf8")
}

async function main() {
  let chromium: typeof import("playwright").chromium
  try {
    ;({ chromium } = await import("playwright"))
  } catch {
    console.error(
      "Playwright is required. Install once:\n  npm install -D playwright\n  npx playwright install chromium"
    )
    process.exit(1)
  }

  console.log("Building Tailwind bundle for highlight captures…")
  await buildHighlightCss()

  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(TEMP_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  console.log(`Generating ${HIGHLIGHT_SLIDES.length} highlight PNGs →\n  ${OUT_DIR}\n`)

  for (const slide of HIGHLIGHT_SLIDES) {
    const htmlPath = path.join(TEMP_DIR, slide.filename.replace(".png", ".html"))
    const cssUrl = `file:///${CSS_PATH.replace(/\\/g, "/")}`
    const html = renderSlideHtml(slide, cssUrl)
    await writeFile(htmlPath, html, "utf8")
    const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`

    await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 60_000 })
    await page.waitForSelector("#slide", { state: "visible" })
    await page.evaluate(async () => {
      const imgs = Array.from(document.images)
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve()
                return
              }
              img.addEventListener("load", () => resolve(), { once: true })
              img.addEventListener("error", () => resolve(), { once: true })
            })
        )
      )
    })

    const el = page.locator("#slide")
    const outPath = path.join(OUT_DIR, slide.filename)
    await el.screenshot({ path: outPath, type: "png" })
    console.log(`  ✓ ${slide.filename}`)
  }

  await browser.close()
  console.log("\nDone. Upload these to Instagram Highlights manually.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
