import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("Cron started");

    
    const { data: searches, error } = await supabase
      .from("search_profiles")
      .select("*");

    if (error) {
      console.error("DB error:", error);
      throw error;
    }

    
    for (const search of searches) {
      const email = search.email;
      const games = search.games || [];
      const preferences = search.preferences || {};

      const budget = preferences.budget || 999;

      // 3. Loop sui giochi salvati
      for (const game of games) {
        const title = game.title;

        try {
          
          const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
            title
          )}&limit=1`;

          const res = await fetch(url);
          const data = await res.json();

          if (!data || data.length === 0) continue;

          const cheapest = parseFloat(data[0].cheapest);

          
          if (cheapest <= budget) {
            console.log(`Match trovato: ${title} a ${cheapest}`);

            
            const { data: alreadySent } = await supabase
              .from("sent_alerts")
              .select("*")
              .eq("user_id", search.user_id)
              .eq("game_title", title)
              .limit(1);

            if (alreadySent && alreadySent.length > 0) {
              continue;
            }

            
            await resend.emails.send({
              from: "GamePing <onboarding@resend.dev>",
              to: email,
              subject: "🔥 Game on sale!",
              html: `
                <h2>🎮 Game in sconto!</h2>
                <p><strong>${title}</strong></p>
                <p>Prezzo attuale: ${cheapest}$</p>
                <p>Budget: ${budget}$</p>
              `,
            });

            
            await supabase.from("sent_alerts").insert({
              user_id: search.user_id,
              game_title: title,
            });
          }
        } catch (err) {
          console.error("Errore su gioco:", title, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron finished",
    });
  } catch (error) {
    console.error("Cron error:", error);

    return NextResponse.json(
      { error: "Cron failed" },
      { status: 500 }
    );
  }
}