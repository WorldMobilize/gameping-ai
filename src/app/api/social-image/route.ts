import { NextRequest, NextResponse } from "next/server"

const ALLOWED_HOST_SUFFIXES = [".rawg.io", ".rawg.com"] as const
const ALLOWED_EXACT_HOSTS = new Set(["images.igdb.com", "media.rawg.io"])

function isAllowedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (ALLOWED_EXACT_HOSTS.has(host)) return true
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
}

function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === "localhost" || h.endsWith(".local")) return true
  if (h === "127.0.0.1" || h.startsWith("127.")) return true
  if (h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("169.254.")) {
    return true
  }
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  return false
}

/** Minimal HTTPS image proxy for client-side social export (avoids canvas CORS taint). */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url")?.trim()
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "Only https images allowed" }, { status: 400 })
  }

  if (isPrivateHostname(target.hostname) || !isAllowedImageHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "image/*" },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 })
    }

    const bytes = await upstream.arrayBuffer()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 })
  }
}
