import { NextResponse } from "next/server";
import {
  describeCreatorCode,
  isCreatorProgramEnabled,
} from "@/lib/creator-referrals";

export const runtime = "nodejs";

/**
 * Validate a creator code entered in the redeem field, so the buyer sees what it
 * does ("20% off" / "7-day trial") before paying. Read-only; the real discount
 * is applied server-side at checkout.
 */
export async function GET(req: Request) {
  if (!isCreatorProgramEnabled()) return NextResponse.json({ valid: false });

  const code = new URL(req.url).searchParams.get("code");
  if (!code || !code.trim()) return NextResponse.json({ valid: false });

  const info = await describeCreatorCode(code);
  return NextResponse.json(
    info ? { valid: true, type: info.type } : { valid: false }
  );
}
