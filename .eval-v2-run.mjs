import { writeFileSync } from "fs";

const PROMPTS = [
  "gioco che ti fa sentire solo ma in modo bello",
  "voglio un gioco con un mondo strano che non capisci subito",
  "gioco da ascoltare con musica di notte mentre piove",
  "qualcosa che mi faccia sentire intelligente quando gioco",
  "gioco dove esplorare è più importante del combattere",
  "voglio un gioco che sembri un sogno strano",
  "gioco che ti prende lentamente e poi ti ossessiona",
  "qualcosa con una community chill e non tossica",
  "gioco dove puoi vivere una seconda vita",
  "gioco che dà la sensazione di avventura vera",
];

const BASE = "http://localhost:3000/api/recommend?debug=1&nocache=1";
const results = [];

for (let i = 0; i < PROMPTS.length; i++) {
  const prompt = PROMPTS[i];
  const started = Date.now();
  process.stdout.write(`[${i + 1}/${PROMPTS.length}] ${prompt.slice(0, 48)}… `);
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPrompt: prompt,
        filtersEnabled: false,
        genres: "",
        playStyles: "",
        vibes: "",
        mechanics: "",
        platform: "",
        budget: "",
      }),
    });
    const latencyMs = Date.now() - started;
    const data = await res.json();
    results.push({
      index: i + 1,
      prompt,
      ok: res.ok,
      status: res.status,
      latencyMs,
      data,
    });
    const n = Array.isArray(data.games) ? data.games.length : 0;
    console.log(`${res.status} ${latencyMs}ms games=${n}`);
  } catch (err) {
    results.push({
      index: i + 1,
      prompt,
      ok: false,
      error: String(err),
      latencyMs: Date.now() - started,
    });
    console.log(`ERR ${err}`);
  }
  await new Promise((r) => setTimeout(r, 1200));
}

writeFileSync(
  "eval-quality-v2-abstract-prompts.json",
  JSON.stringify(results, null, 2),
  "utf8"
);
console.log("\nWrote eval-quality-v2-abstract-prompts.json");
