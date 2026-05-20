import { NextResponse } from "next/server";

/**
 * Debug/development CheapShark games proxy (GET ?title=...).
 * Not used by the app UI. Disabled in production unless ENABLE_PUBLIC_DEALS_API=true
 * to avoid bot/crawler abuse amplifying CheapShark 429s on our server IP.
 */
function isPublicDealsApiEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ENABLE_PUBLIC_DEALS_API === "true";
}

export async function GET(req: Request) {
  if (!isPublicDealsApiEnabled()) {
    return NextResponse.json(
      {
        error: "gone",
        message:
          "This debug CheapShark proxy is disabled in production. Set ENABLE_PUBLIC_DEALS_API=true only if you intentionally need it.",
      },
      { status: 410 }
    );
  }

  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json(
      { error: "Missing title" },
      { status: 400 }
    );
  }

  try {
    const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
      title
    )}&limit=5`;

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: "CheapShark fetch failed" },
        { status: 500 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      title,
      results: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
