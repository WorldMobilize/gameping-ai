"use client";

import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ToastProvider";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Game = {
  title: string;
  match: number;
  reason: string;
  price: string;
  buyLink?: string | null;
  image?: string | null;
};

type RecommendDebug = {
  resolvedInput?: string;
  selected?: { titles?: string[] };
  finalResponse?: { count?: number; titles?: string[] };
};

const platforms = [
  {
    name: "PC",
    icon: "/platforms/pc.svg",
    text: "Steam, Epic, GOG",
  },
  {
    name: "PlayStation",
    icon: "/platforms/playstation.svg",
    text: "PS4 / PS5",
  },
  {
    name: "Xbox",
    icon: "/platforms/xbox.svg",
    text: "Xbox One / Series",
  },
  {
    name: "Nintendo Switch",
    icon: "/platforms/switch.svg",
    text: "Portable & cozy",
  },
];

const presets = [
  {
    title: "Cheap hidden gems",
    text: "Find me underrated games under $10 that feel special.",
    budget: "10",
    genres: "Indie, Roguelike, Puzzle",
    playStyles: "Singleplayer",
    vibes: "Atmospheric, Weird",
    mechanics: "Replayable, Exploration",
  },
  {
    title: "Cozy evening",
    text: "I want a relaxing cozy game for short evening sessions.",
    budget: "25",
    genres: "Simulation, Adventure, Indie",
    playStyles: "Casual, Singleplayer",
    vibes: "Cozy, Relaxing, Cute",
    mechanics: "Short Sessions, Crafting, Exploration",
  },
  {
    title: "Dark story",
    text: "I want a dark story-rich game with atmosphere and emotional impact.",
    budget: "30",
    genres: "RPG, Horror, Adventure",
    playStyles: "Singleplayer",
    vibes: "Dark, Emotional, Mysterious",
    mechanics: "Story-rich, Choices Matter, Exploration",
  },
  {
    title: "Competitive grind",
    text: "Find me something competitive, skill-based and replayable.",
    budget: "40",
    genres: "FPS, Fighting, Action",
    playStyles: "Multiplayer, PvP, Competitive",
    vibes: "Intense, Fast",
    mechanics: "Fast-paced, Replayable, Combat-heavy",
  },
];

const tagGroups = [
  {
    key: "genres",
    title: "What do you want to play?",
    subtitle: "Pick a genre. 2–4 tags are enough.",
    tags: [
      "RPG",
      "Action",
      "Adventure",
      "FPS",
      "Shooter",
      "Strategy",
      "Simulation",
      "Survival",
      "Horror",
      "Racing",
      "Sports",
      "Fighting",
      "Puzzle",
      "Platformer",
      "Roguelike",
      "Metroidvania",
      "Card Battler",
      "Deckbuilding",
      "Management",
      "Sandbox",
    ],
  },
  {
    key: "playStyles",
    title: "How do you want to play?",
    subtitle: "Solo, with friends, competitive, or chill.",
    tags: [
      "Singleplayer",
      "Multiplayer",
      "Online Co-op",
      "Local Co-op",
      "PvP",
      "PvE",
      "MMO",
      "Competitive",
      "Casual",
      "Controller Friendly",
      "Steam Deck Friendly",
    ],
  },
  {
    key: "vibes",
    title: "What vibe are you looking for?",
    subtitle: "Help GamePing understand the vibe you want.",
    tags: [
      "Cozy",
      "Dark",
      "Funny",
      "Emotional",
      "Relaxing",
      "Atmospheric",
      "Weird",
      "Cute",
      "Epic",
      "Brutal",
      "Mysterious",
      "Cyberpunk",
      "Fantasy",
      "Sci-fi",
      "Medieval",
      "Post-apocalyptic",
      "Intense",
      "Chill",
    ],
  },
  {
    key: "mechanics",
    title: "What should the game feel like?",
    subtitle: "Mechanics, pacing, and feel.",
    tags: [
      "Open World",
      "Linear",
      "Story-rich",
      "Choices Matter",
      "Exploration",
      "Combat-heavy",
      "Loot",
      "Crafting",
      "Base Building",
      "Stealth",
      "Tactical",
      "Turn-Based",
      "Fast-paced",
      "Slow-paced",
      "Short Sessions",
      "Replayable",
    ],
  },
] as const;

export default function RecommendPage() {
  const { showToast } = useToast();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [apiDebug, setApiDebug] = useState<RecommendDebug | null>(null);

  const [form, setForm] = useState({
    userPrompt: "",
    genres: "",
    playStyles: "",
    vibes: "",
    mechanics: "",
    platform: "",
    budget: "20",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [limitReached, setLimitReached] = useState<{
    message: string;
    limit?: number;
  } | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const [loggedUserEmail, setLoggedUserEmail] = useState<string | null>(null);
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setLoggedUserEmail(data.user.email ?? null);
        setLoggedUserId(data.user.id);
      }
    }

    getUser();
  }, []);

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleTag(field: keyof typeof form, tag: string) {
    const current = form[field]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const updated = current.includes(tag)
      ? current.filter((item) => item !== tag)
      : [...current, tag];

    updateField(field, updated.join(", "));
  }

  function isActive(field: keyof typeof form, tag: string) {
    return form[field]
      .split(",")
      .map((item) => item.trim())
      .includes(tag);
  }

  function applyPreset(preset: (typeof presets)[number]) {
    setForm((prev) => ({
      ...prev,
      userPrompt: preset.text,
      budget: preset.budget,
      genres: preset.genres,
      playStyles: preset.playStyles,
      vibes: preset.vibes,
      mechanics: preset.mechanics,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEmailSaved(false);
    setApiDebug(null);

    try {
      const debugEnabled =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("debug") === "1";
      const endpoint = debugEnabled ? "/api/recommend?debug=1" : "/api/recommend";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          variant: "error",
          message: "We couldn’t get recommendations. Try again in a moment.",
        });
        setLoading(false);
        return;
      }

      setGames(data.games || []);
      if (debugEnabled && data?.debug) {
        setApiDebug(data.debug as RecommendDebug);
      }
      setLoading(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error(err);
      showToast({
        variant: "error",
        message: "Something went wrong. Check your connection and try again.",
      });
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLimitReached(null);

    if (!loggedUserEmail) {
      showToast({
        variant: "info",
        message: "Log in to save this search and get deal alerts.",
      });
      return;
    }

    try {
      const res = await fetch("/api/save-search", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loggedUserEmail,
          name: `${form.vibes || form.genres || "Custom"} games`,
          preferences: form,
          games,
          user_id: loggedUserId,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setEmailSaved(true);
        showToast({
          variant: "success",
          message: "Search saved. We’ll watch for deals that match your taste.",
        });
      } else {
        if (result.error === "limit_reached") {
          setLimitReached({
            message:
              result.message ||
              "Upgrade to Premium to save more searches",
            limit: typeof result.limit === "number" ? result.limit : undefined,
          });
          showToast({
            variant: "info",
            title: "Saved search limit reached",
            message:
              result.message ||
              "You’ve used all saved searches on your current plan. Upgrade to save more.",
          });
        } else {
          showToast({
            variant: "error",
            message: "Couldn’t save your search. Please try again.",
          });
        }
      }
    } catch (err) {
      console.error(err);
      showToast({
        variant: "error",
        message: "Couldn’t save your search. Please try again.",
      });
    }
  }

  function copyResults() {
    const text = games
      .map((game, index) => `${index + 1}. ${game.title} (${game.match}% match)`)
      .join("\n");

    navigator.clipboard.writeText(`My GamePing AI results:\n\n${text}`);
    showToast({ variant: "info", message: "Results copied to your clipboard." });
  }

  function buildOutboundUrl(game: Game) {
  if (!game.buyLink) return "#";

  const params = new URLSearchParams({
    to: game.buyLink,
    game: game.title,
    price: game.price || "",
    source: "recommend",
  });

  return `/api/out?${params.toString()}`;
}

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar ctaLabel="Home" ctaHref="/" />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-0 top-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-96 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.5em] text-cyan-300">
                GamePing AI
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
                Find the game you actually feel like playing.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
                Write one sentence or pick a few tags—no endless quiz.
                GamePing understands your vibe and finds games with real prices.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Best results
              </p>

              <div className="mt-5 space-y-4 text-sm text-white/70">
                <p>✔ Write one sentence if you already have an idea</p>
                <p>✔ Pick 3–8 tags max</p>
                <p>✔ Set budget and platform</p>
                <p>✔ Leave anything blank if you don’t care</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(168,85,247,0.08)] md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Start here
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Describe what you want to play
                <span className="text-white/40"> (optional)</span>
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                This is the easiest way to get great picks.
              </p>

              <textarea
                placeholder={`Examples:
"Something like Stardew Valley but with more action"
"A dark, story-rich game under $20"
"Like Elden Ring, but less punishing"
"A cozy game for short evening sessions"`}
                className="mt-6 min-h-44 w-full rounded-3xl border border-white/10 bg-black/40 p-5 text-sm leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/70 focus:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                value={form.userPrompt}
                onChange={(e) => updateField("userPrompt", e.target.value)}
              />
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Quick presets
              </p>

              <h2 className="mt-3 text-2xl font-black">
                Start from a preset vibe
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {presets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-3xl border border-white/10 bg-black/30 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-400/60 hover:bg-cyan-400/10"
                  >
                    <p className="font-black">{preset.title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      {preset.text}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                  Platform
                </p>

                <h2 className="mt-3 text-2xl font-black">Where do you want to play?</h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.name}
                      type="button"
                      onClick={() => updateField("platform", platform.name)}
                      className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 ${
                        form.platform === platform.name
                          ? "border-purple-400 bg-purple-500/25 shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                          : "border-white/10 bg-black/30 hover:border-purple-400/60"
                      }`}
                    >
                      <div className="h-8 w-8">
                        <img
                          src={platform.icon}
                          alt={platform.name}
                          className="h-full w-full object-contain opacity-80"
                        />
                      </div>
                      <div className="mt-4 font-black">{platform.name}</div>
                      <div className="mt-1 text-xs text-white/45">
                        {platform.text}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                  Budget
                </p>

                <h2 className="mt-3 text-2xl font-black">
                  What’s your max budget?
                </h2>

                <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">$0</span>
                    <span className="rounded-full bg-cyan-400 px-5 py-2 text-lg font-black text-black">
                      ${form.budget || "0"}
                    </span>
                    <span className="text-sm text-white/40">$80</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    className="mt-6 w-full accent-cyan-400"
                  />

                  <input
                    type="number"
                    placeholder="Es. 20"
                    className="mt-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4 outline-none transition focus:border-cyan-400"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    Taste builder
                  </p>

                  <h2 className="mt-3 text-2xl font-black">
                    Pick a few tags
                  </h2>

                  <p className="mt-2 text-sm text-white/50">
                    You don’t need all of them. 3–8 tags is perfect.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  {showAdvanced ? "Hide extra tags" : "Show more tags"}
                </button>
              </div>

              <div className="mt-8 space-y-8">
                {tagGroups
                  .filter((_, index) => showAdvanced || index < 2)
                  .map((group) => (
                    <div key={group.key}>
                      <h3 className="text-lg font-black">{group.title}</h3>
                      <p className="mt-1 text-sm text-white/45">
                        {group.subtitle}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {group.tags.map((tag) => {
                          const active = isActive(group.key, tag);

                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(group.key, tag)}
                              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                                active
                                  ? "bg-cyan-400 text-black shadow-[0_0_25px_rgba(34,211,238,0.28)]"
                                  : "border border-white/10 bg-black/30 text-white/65 hover:border-cyan-400/60 hover:text-cyan-300"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-400/15 to-purple-500/15 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    Ready to analyze your taste?
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    You’ll get five picks with match scores, tailored explanations, and the
                    best tracked price we found.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-cyan-400 px-10 py-4 font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Analyzing your taste..." : "Find my perfect games →"}
                </button>
              </div>
            </div>
          </form>

          {loading && (
            <section className="mt-10 grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
                />
              ))}
            </section>
          )}

          {games.length > 0 && !loading && (
            <div ref={resultsRef}>
              <div className="mt-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    Results
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    Found games that match your taste
                  </h2>
                </div>

                <button
                  onClick={copyResults}
                  className="rounded-full border border-cyan-400/40 px-6 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10"
                >
                  Copy results
                </button>
              </div>

              {apiDebug && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-white/50">
                    Debug
                  </p>
                  <p className="mt-2">
                    Resolved input:{" "}
                    <span className="font-bold text-white">
                      {apiDebug.resolvedInput || "(none)"}
                    </span>
                  </p>
                  <p className="mt-2">
                    API finalResponse titles ({apiDebug.finalResponse?.count ?? "?"}
                    ):{" "}
                    <span className="text-white/85">
                      {(apiDebug.finalResponse?.titles || []).join(" • ") || "(none)"}
                    </span>
                  </p>
                  <p className="mt-2">
                    UI rendered titles ({games.length}):{" "}
                    <span className="text-white/85">
                      {games.map((g) => g.title).join(" • ")}
                    </span>
                  </p>
                </div>
              )}

              <section className="mt-6 grid gap-6 md:grid-cols-2">
                {games.map((game, index) => (
                  <div
                    key={`${game.title}-${index}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(168,85,247,0.12)] transition hover:-translate-y-1 hover:border-cyan-400/40"
                  >
                    {game.image ? (
                      <div className="h-48 w-full overflow-hidden bg-black/40">
                        <img
                          src={game.image}
                          alt={game.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-black/40 text-white/40">
                        No image available
                      </div>
                    )}

                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">
                          #{index + 1}
                        </span>

                        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
                          {game.match}% match
                        </span>
                      </div>

                      <h2 className="text-2xl font-black">{game.title}</h2>

                      <p className="mt-4 min-h-[7.5rem] text-sm leading-6 text-white/70 md:min-h-[6.5rem]">
                        💡 {game.reason}
                      </p>

                      <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-white/40">
                            Best price
                          </p>
                          <p className="text-xl font-black text-cyan-300">
                            {game.price !== "N/A" ? `$${game.price}` : "N/A"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={`/game/${encodeURIComponent(game.title)}`}
                            className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-cyan-400/50 hover:text-cyan-300"
                          >
                            View details
                          </a>

                          {game.buyLink ? (
                            <a
                              href={buildOutboundUrl(game)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-300"
                            >
                              Buy now →
                            </a>
                          ) : (
                            <span className="text-sm text-white/40">
                              Not available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <form
                onSubmit={handleEmailSubmit}
                className="mt-10 rounded-3xl border border-purple-500/40 bg-purple-500/10 p-6"
              >
                <h2 className="text-2xl font-black">
                  Want smart price alerts?
                </h2>

                <p className="mt-2 text-white/60">
                  Save this search and GamePing will track deals for you.
                </p>

                {loggedUserEmail && (
                  <p className="mt-4 text-sm text-cyan-300">
                    We’ll save this search for: {loggedUserEmail}
                  </p>
                )}

                <div className="mt-6">
                  {loggedUserEmail ? (
                    <button
                      type="submit"
                      className="rounded-full bg-purple-500 px-8 py-4 font-bold text-white transition hover:bg-purple-400"
                    >
                      Save search
                    </button>
                  ) : (
                    <a
                      href="/login"
                      className="inline-block rounded-full bg-cyan-400 px-8 py-4 font-bold text-black transition hover:bg-cyan-300"
                    >
                      Log in / Sign up to save
                    </a>
                  )}
                </div>

                {limitReached && (
                  <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
                    <p className="text-sm font-bold text-cyan-200">
                      {limitReached.message}
                      {typeof limitReached.limit === "number"
                        ? ` (limit: ${limitReached.limit})`
                        : ""}
                    </p>
                    <a
                      href="/upgrade"
                      className="mt-3 inline-block rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black transition hover:bg-cyan-300"
                    >
                      Upgrade to Premium →
                    </a>
                  </div>
                )}
              </form>

              {!emailSaved && (
                <p className="mt-4 text-sm text-white/50">
                  Free plan: up to 3 saved searches • Upgrade to unlock more
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}