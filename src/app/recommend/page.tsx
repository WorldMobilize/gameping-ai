"use client";

import Link from "next/link";
import PlanLimitReached from "@/components/PlanLimitReached";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ToastProvider";
import {
  LIMIT_TOAST_DURATION_MS,
  limitReachedToastMessage,
} from "@/lib/product-copy";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROMPT_MAX_ADMIN,
  PROMPT_MAX_DEFAULT,
} from "@/lib/recommend-limits";
import { supabase } from "@/lib/supabase";
type Game = {
  title: string;
  match: number;
  reason: string;
  price?: string | null;
  currency?: string | null;
  buyLink?: string | null;
  image?: string | null;
  matchTier?: "best_match" | "good_alternative" | "partial_match";
  matchNote?: string;
  budgetStatus?: "within_budget" | "above_budget" | "unknown_price";
  budgetNote?: string;
};

type RecommendDebug = {
  resolvedInput?: string;
  selected?: { titles?: string[] };
  finalResponse?: { count?: number; titles?: string[] };
};

function gameDetailHrefFromRecommend(game: Game): string {
  const params = new URLSearchParams();
  params.set("from", "recommend");
  params.set("fitReason", game.reason);
  if (game.matchNote?.trim()) params.set("fitNote", game.matchNote.trim());
  if (Number.isFinite(game.match)) params.set("match", String(game.match));
  if (game.matchTier) params.set("fitTier", game.matchTier);
  return `/game/${encodeURIComponent(game.title)}?${params.toString()}`;
}

function prefersItalianRecommendCopy(prompt: string): boolean {
  const t = prompt.trim();
  if (!t) return false;
  if (/[àèéìòù]/i.test(t)) return true;
  return /\b(vorrei|giochi|simile|simili|tipo|però|sera|amici|cozy|quando|più|meno)\b/i.test(t);
}

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

const RECOMMEND_LOADING_STEPS = [
  "Understanding your request…",
  "Finding verified games…",
  "Ranking best matches…",
  "Preparing results…",
];

const RECOMMEND_LOADING_HELPERS = [
  "GamePing is deeply analyzing your request.",
  "First searches may take longer — repeated searches are usually instant.",
  "We prefer fewer high-quality matches over random filler.",
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
  const emptyResultsRef = useRef<HTMLDivElement | null>(null);
  const submitBusyRef = useRef(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [promptScrollable, setPromptScrollable] = useState(false);

  const syncPromptTextareaOverflow = useCallback(() => {
    const el = promptTextareaRef.current;
    if (!el) return;
    setPromptScrollable(el.scrollHeight > el.clientHeight + 1);
  }, []);

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

  /** When true, user sees budget/tags/platform and backend applies strict filter mode. */
  const [filtersEnabled, setFiltersEnabled] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [saveLimitReached, setSaveLimitReached] = useState(false);
  const [saveLimitPlan, setSaveLimitPlan] = useState<string | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [dailyLimitContext, setDailyLimitContext] = useState<{
    plan: string | null;
    anonymous: boolean;
  } | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [resultsReveal, setResultsReveal] = useState(false);
  /** True after a successful API response returned zero games (not initial page load). */
  const [noStrongMatchesAfterSuccess, setNoStrongMatchesAfterSuccess] =
    useState(false);

  const [loggedUserEmail, setLoggedUserEmail] = useState<string | null>(null);
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [promptMaxForUi, setPromptMaxForUi] = useState(PROMPT_MAX_DEFAULT);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setLoggedUserEmail(data.user.email ?? null);
        setLoggedUserId(data.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", data.user.id)
          .maybeSingle();
        setUserPlan(profile?.plan ?? "free");
        setPromptMaxForUi(
          profile?.plan === "admin" ? PROMPT_MAX_ADMIN : PROMPT_MAX_DEFAULT
        );
      } else {
        setUserPlan(null);
        setPromptMaxForUi(PROMPT_MAX_DEFAULT);
      }
    }

    getUser();
  }, []);

  useEffect(() => {
    syncPromptTextareaOverflow();
    const el = promptTextareaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => syncPromptTextareaOverflow());
    observer.observe(el);
    return () => observer.disconnect();
  }, [form.userPrompt, syncPromptTextareaOverflow]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setLoadingStepIndex((i) => (i + 1) % RECOMMEND_LOADING_STEPS.length);
    }, 2600);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (loading || games.length === 0) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      queueMicrotask(() => setResultsReveal(true));
      return;
    }
    const id = window.setTimeout(() => setResultsReveal(true), 45);
    return () => clearTimeout(id);
  }, [loading, games.length]);

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
    setFiltersEnabled(true);
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
    if (submitBusyRef.current || loading) return;
    if (form.userPrompt.trim().length > promptMaxForUi) {
      showToast({
        variant: "error",
        message:
          promptMaxForUi <= PROMPT_MAX_DEFAULT
            ? "Prompt too long. Please keep it under 500 characters."
            : `Prompt too long. Keep it under ${promptMaxForUi} characters.`,
      });
      return;
    }

    submitBusyRef.current = true;
    setLoading(true);
    setLoadingStepIndex(0);
    setResultsReveal(false);
    setNoStrongMatchesAfterSuccess(false);
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
        body: JSON.stringify({ ...form, filtersEnabled }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        plan?: string;
        limit?: number;
        limitType?: string;
        games?: Game[];
        debug?: RecommendDebug;
      };

      if (!res.ok) {
        if (res.status === 400 && data?.error === "prompt_too_long") {
          showToast({
            variant: "error",
            message:
              data.message ||
              "Prompt too long. Please keep it under 500 characters.",
          });
        } else if (res.status === 429 && data?.error === "daily_limit") {
          const limitPlan =
            typeof data.plan === "string" ? data.plan : userPlan;
          const anonymous = !loggedUserId;
          setDailyLimitContext({ plan: limitPlan, anonymous });
          setDailyLimitReached(true);
          const toast = limitReachedToastMessage({
            limitType: "daily_recommendations",
            plan: limitPlan,
            anonymous,
          });
          showToast({
            variant: "info",
            title: toast.title,
            message: data.message || toast.message,
            durationMs: LIMIT_TOAST_DURATION_MS,
          });
        } else {
          showToast({
            variant: "error",
            message:
              data.message ||
              "We couldn’t get recommendations. Try again in a moment.",
          });
        }
        return;
      }

      const nextGames = data.games ?? [];
      setGames(nextGames);
      setNoStrongMatchesAfterSuccess(nextGames.length === 0);
      if (debugEnabled && data?.debug) {
        setApiDebug(data.debug as RecommendDebug);
      }

      setTimeout(() => {
        if (nextGames.length > 0) {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          emptyResultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 140);
    } catch (err) {
      console.error(err);
      showToast({
        variant: "error",
        message: "Something went wrong. Check your connection and try again.",
      });
    } finally {
      submitBusyRef.current = false;
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveLimitReached(false);
    setSaveLimitPlan(null);

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
          preferences: { ...form, filtersEnabled },
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
          const limitPlan =
            typeof result.plan === "string" ? result.plan : userPlan;
          setSaveLimitPlan(limitPlan);
          setSaveLimitReached(true);
          const toast = limitReachedToastMessage({
            limitType: "saved_runs",
            plan: limitPlan,
          });
          showToast({
            variant: "info",
            title: toast.title,
            message: result.message || toast.message,
            durationMs: LIMIT_TOAST_DURATION_MS,
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
                {filtersEnabled
                  ? "Use filters for more specific recommendations. Verified prices live on each game’s details page."
                  : "Describe the kind of game you want—free-form, AI-first discovery. Turn on Advanced filters when you want budget, tags, or platform to steer results."}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Best results
              </p>

              <div className="mt-5 space-y-4 text-sm text-white/70">
                {filtersEnabled ? (
                  <>
                    <p>✔ Combine prompt + tags for tighter picks</p>
                    <p>✔ Use budget and platform when they matter</p>
                    <p>✔ Leave fields blank if you don’t care</p>
                  </>
                ) : (
                  <>
                    <p>✔ Lead with a vivid prompt—vibe and intent first</p>
                    <p>✔ Advanced filters optional for precise searches</p>
                    <p>✔ Check deals on each game’s page</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 space-y-6"
            aria-busy={loading}
          >
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(168,85,247,0.08)] md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Start here
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Describe what you want to play
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {filtersEnabled
                  ? "Use filters for more specific recommendations."
                  : "Describe the kind of game you want."}
              </p>

              <textarea
                ref={promptTextareaRef}
                id="recommend-prompt"
                placeholder={`Examples:
"Something like Stardew Valley but with more action"
"A dark, story-rich game under $20"
"Like Elden Ring, but less punishing"
"A cozy game for short evening sessions"`}
                maxLength={promptMaxForUi}
                className={`gp-prompt-textarea mt-6 min-h-48 w-full resize-y rounded-3xl border border-white/10 bg-black/40 p-5 text-sm leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/70 focus:shadow-[0_0_30px_rgba(34,211,238,0.12)] ${
                  promptScrollable ? "overflow-y-auto" : "overflow-y-hidden"
                }`}
                value={form.userPrompt}
                onChange={(e) => {
                  updateField("userPrompt", e.target.value);
                  requestAnimationFrame(syncPromptTextareaOverflow);
                }}
              />

              <p
                className={`mt-2 text-xs tabular-nums ${
                  form.userPrompt.length > promptMaxForUi
                    ? "text-rose-400"
                    : "text-white/40"
                }`}
              >
                {form.userPrompt.length} / {promptMaxForUi}
              </p>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  role="switch"
                  aria-checked={filtersEnabled}
                  onClick={() => setFiltersEnabled((v) => !v)}
                  className={`flex max-w-full items-center gap-3 rounded-full border px-5 py-3 text-left text-sm font-bold transition ${
                    filtersEnabled
                      ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-black/30 text-white/75 hover:border-white/25"
                  }`}
                >
                  <span
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors ${
                      filtersEnabled ? "justify-end bg-cyan-400" : "justify-start bg-white/20"
                    }`}
                  >
                    <span className="inline-block h-7 w-7 rounded-full bg-black shadow" />
                  </span>
                  <span>Advanced filters</span>
                </button>
              </div>
            </section>

            <div
              className={`grid gap-6 transition-[opacity,max-height] duration-300 ease-out ${
                filtersEnabled
                  ? "max-h-[12000px] opacity-100"
                  : "pointer-events-none max-h-0 overflow-hidden opacity-0"
              }`}
              aria-hidden={!filtersEnabled}
            >
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

              <div className="mt-8 space-y-8">
                {tagGroups
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
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-400/15 to-purple-500/15 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    Ready to analyze your taste?
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    You’ll get up to five picks with match scores and tailored explanations.
                    Check prices and deals on the game details page.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-disabled={loading}
                  className="rounded-full bg-cyan-400 px-10 py-4 font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Analyzing your taste..." : "Find my perfect games"}
                </button>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-center text-sm leading-relaxed text-white/45 md:mx-auto">
              You can try recommendations without logging in. Create a free account to save
              searches and track game deals.
            </p>
          </form>

          {dailyLimitReached && (
            <PlanLimitReached
              limitType="daily_recommendations"
              plan={dailyLimitContext?.plan ?? userPlan}
              anonymous={dailyLimitContext?.anonymous ?? !loggedUserId}
              className="mx-auto mt-8 max-w-xl"
            />
          )}

          {loading && (
            <div
              className="mt-10 md:mt-12"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="mx-auto max-w-xl px-1">
                <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Working on it
                </p>

                <p
                  key={loadingStepIndex}
                  className="gp-recommend-step-animate mb-3 text-center text-[15px] font-bold leading-snug tracking-tight text-cyan-50 md:text-lg md:leading-snug"
                >
                  {RECOMMEND_LOADING_STEPS[loadingStepIndex]}
                </p>

                <div
                  className="mx-auto mb-6 h-1 max-w-[220px] overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-white/[0.06]"
                  aria-hidden="true"
                >
                  <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-cyan-400/30 via-cyan-300/60 to-purple-500/30 motion-reduce:animate-none" />
                </div>

                <ul className="mb-8 space-y-2.5 text-center text-[13px] leading-relaxed text-white/45 md:text-sm md:leading-relaxed">
                  {RECOMMEND_LOADING_HELPERS.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <section className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="gp-recommend-skeleton-bar relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] animate-pulse motion-reduce:animate-none"
                  />
                ))}
              </section>
            </div>
          )}

          {!loading && noStrongMatchesAfterSuccess && games.length === 0 && (
            <div
              ref={emptyResultsRef}
              className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_40px_rgba(34,211,238,0.06)] md:p-10"
              role="status"
              aria-live="polite"
            >
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                No picks this round
              </p>
              <h2 className="mt-4 text-2xl font-black md:text-3xl">
                We couldn&apos;t find strong matches for this vibe yet.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                That doesn&apos;t mean your taste is wrong—sometimes the best move is a sharper
                prompt, looser filters, or a different angle. Try describing mood, pacing, or a
                reference game you love.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href="#recommend-prompt"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
                >
                  Try another vibe
                </a>
                <Link
                  href="/curated"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
                >
                  Browse curated lists
                </Link>
                <Link
                  href="/games"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
                >
                  Explore games A–Z
                </Link>
              </div>
            </div>
          )}

          {games.length > 0 && !loading && (
            <div
              ref={resultsRef}
              className={`transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
                resultsReveal
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
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
                  type="button"
                  onClick={copyResults}
                  className="text-xs font-semibold text-white/35 underline-offset-2 transition hover:text-white/55 hover:underline"
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

              <section className="mt-6 grid items-stretch gap-6 md:grid-cols-2">
                {games.map((game, index) => (
                  <div
                    key={`${game.title}-${index}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(168,85,247,0.12)] transition hover:-translate-y-1 hover:border-cyan-400/40"
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

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3">
                        <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">
                          #{index + 1}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black">{game.title}</h2>

                      {game.matchNote ? (
                        <p className="mt-2 text-xs leading-5 text-white/50">
                          {game.matchNote}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {game.matchTier === "good_alternative" && (
                          <span className="rounded-full bg-amber-500/25 px-3 py-1 text-xs font-bold text-amber-200">
                            Good alternative
                          </span>
                        )}
                        {game.matchTier === "partial_match" && (
                          <span className="rounded-full bg-orange-500/25 px-3 py-1 text-xs font-bold text-orange-200">
                            Partial match
                          </span>
                        )}
                        {game.matchTier === "best_match" && (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                            Best match
                          </span>
                        )}
                        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
                          {game.match}% match
                        </span>
                      </div>

                      {form.budget.trim() || game.budgetNote ? (
                        <p className="mt-3 text-xs text-white/45">
                          {game.budgetNote ??
                            (prefersItalianRecommendCopy(form.userPrompt)
                              ? "Prezzi verificati nella scheda gioco, quando disponibili."
                              : "Verified prices on the game page when available.")}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-1 flex-col">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                          Why it fits
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/70">{game.reason}</p>
                      </div>

                      <div className="mt-auto border-t border-white/10 pt-5">
                        <a
                          href={gameDetailHrefFromRecommend(game)}
                          className="inline-flex rounded-full bg-cyan-400/90 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
                        >
                          View details
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <form
                onSubmit={handleEmailSubmit}
                className="mt-10 rounded-3xl border border-purple-500/40 bg-purple-500/10 p-6"
              >
                <h2 className="text-2xl font-black">Save these recommendations</h2>

                <p className="mt-2 text-white/60">
                  Save this search to your dashboard so you can revisit these picks later. Price
                  alerts for individual games are managed from each game page.
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
                      Save these recommendations
                    </button>
                  ) : (
                    <a
                      href="/login?redirect=%2Frecommend"
                      className="inline-block rounded-full bg-cyan-400 px-8 py-4 font-bold text-black transition hover:bg-cyan-300"
                    >
                      Log in / Sign up to save
                    </a>
                  )}
                </div>

                {saveLimitReached && (
                  <PlanLimitReached
                    limitType="saved_runs"
                    plan={saveLimitPlan ?? userPlan}
                    className="mt-5"
                  />
                )}
              </form>

              {!emailSaved && (
                <p className="mt-4 text-sm text-white/50">
                  Free: 5 recommendations/day, 3 saved runs, 5 tracked games • Premium unlocks more
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}