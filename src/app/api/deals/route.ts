import { NextResponse } from "next/server";

export async function GET(req: Request) {
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