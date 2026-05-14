import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getServiceRoleClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function getEphemeralAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC Supabase env is not set");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user?.id) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = (await req.json()) as {
      confirmPhrase?: string;
      password?: string;
      confirmEmail?: string;
    };

    if (body.confirmPhrase !== "DELETE") {
      return NextResponse.json(
        { error: 'Type the word DELETE exactly to confirm.' },
        { status: 400 }
      );
    }

    let admin;
    try {
      admin = getServiceRoleClient();
    } catch (e) {
      console.error("[delete-account] service role", e);
      return NextResponse.json(
        { error: "Account deletion is not configured on this server." },
        { status: 503 }
      );
    }

    const { data: adminUser, error: adminUserErr } =
      await admin.auth.admin.getUserById(user.id);

    if (adminUserErr || !adminUser?.user) {
      return NextResponse.json(
        { error: "Could not verify your account." },
        { status: 500 }
      );
    }

    const identities = adminUser.user.identities ?? [];
    const hasEmailPasswordIdentity = identities.some((i) => i.provider === "email");

    if (hasEmailPasswordIdentity) {
      const password =
        typeof body.password === "string" ? body.password : "";
      if (!password) {
        return NextResponse.json(
          { error: "Enter your account password to confirm deletion." },
          { status: 400 }
        );
      }
      const email = adminUser.user.email?.trim();
      if (!email) {
        return NextResponse.json(
          { error: "Your account has no email on file; contact support." },
          { status: 400 }
        );
      }
      const verify = getEphemeralAnonClient();
      const { error: pwErr } = await verify.auth.signInWithPassword({
        email,
        password,
      });
      if (pwErr) {
        return NextResponse.json(
          { error: "Password does not match this account." },
          { status: 401 }
        );
      }
    } else {
      const confirm =
        typeof body.confirmEmail === "string" ? body.confirmEmail.trim() : "";
      const expected = adminUser.user.email?.trim().toLowerCase() ?? "";
      if (!expected || confirm.toLowerCase() !== expected) {
        return NextResponse.json(
          {
            error:
              "Enter your full account email address to confirm deletion (OAuth accounts).",
          },
          { status: 400 }
        );
      }
    }

    const userId = user.id;

    const { error: spErr } = await admin
      .from("search_profiles")
      .delete()
      .eq("user_id", userId);
    if (spErr) console.error("[delete-account] search_profiles", spErr);

    const { error: emErr } = await admin.from("emails").delete().eq("user_id", userId);
    if (emErr) console.error("[delete-account] emails", emErr);

    const { error: obErr } = await admin
      .from("outbound_clicks")
      .delete()
      .eq("user_id", userId);
    if (obErr) console.error("[delete-account] outbound_clicks", obErr);

    const { error: prErr } = await admin.from("profiles").delete().eq("user_id", userId);
    if (prErr) console.error("[delete-account] profiles", prErr);

    const { error: tgErr } = await admin.from("tracked_games").delete().eq("user_id", userId);
    if (tgErr) console.error("[delete-account] tracked_games", tgErr);

    await admin
      .from("rate_limit_events")
      .delete()
      .eq("key", `recommend:user:${userId}`);
    await admin.from("rate_limit_events").delete().eq("key", `email:user:${userId}`);

    const { error: delAuthErr } = await admin.auth.admin.deleteUser(userId);

    if (delAuthErr) {
      console.error("[delete-account] auth.admin.deleteUser", delAuthErr);
      return NextResponse.json(
        { error: "Could not remove the auth account. Try again or contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[delete-account]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
