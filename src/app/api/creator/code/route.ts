import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/require-verified-email";
import { createClient } from "@/lib/supabase/server";
import {
  createOrReplaceCreatorCode,
  getActiveCreatorCode,
  isCreatorProgramEnabled,
} from "@/lib/creator-referrals";
import type { ReferralCodeType } from "@/lib/creator-commissions";

export const runtime = "nodejs";

const VALID_TYPES = new Set<ReferralCodeType>(["referral", "discount", "trial"]);

/** The signed-in creator's current active code (null if they don't have one). */
export async function GET() {
  const supabase = await createClient();
  const auth = await requireVerifiedUser(supabase);
  if (!auth.ok) return auth.response;

  if (!isCreatorProgramEnabled()) {
    return NextResponse.json({ enabled: false, code: null });
  }
  const code = await getActiveCreatorCode(auth.user.id);
  return NextResponse.json({ enabled: true, code });
}

/** Create/replace the creator's single active code with the chosen type. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const auth = await requireVerifiedUser(supabase);
  if (!auth.ok) return auth.response;

  if (!isCreatorProgramEnabled()) {
    return NextResponse.json(
      { error: "The creator program is not available yet." },
      { status: 403 }
    );
  }

  let type = "";
  try {
    const body = (await req.json()) as { type?: string };
    type = typeof body.type === "string" ? body.type : "";
  } catch {
    /* invalid body → handled below */
  }
  if (!VALID_TYPES.has(type as ReferralCodeType)) {
    return NextResponse.json({ error: "Pick a valid code type." }, { status: 400 });
  }

  try {
    const code = await createOrReplaceCreatorCode(
      auth.user.id,
      type as ReferralCodeType
    );
    return NextResponse.json({ code, type });
  } catch (err) {
    console.error("[creator/code] create", err);
    return NextResponse.json(
      { error: "Could not create your code. Try again." },
      { status: 500 }
    );
  }
}
