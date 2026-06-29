"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppPageShell from "@/components/app/AppPageShell";
import {
  APP_CARD,
  APP_CARD_LG,
  APP_INPUT,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_PRIMARY_CTA_LG,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import {
  RECOMMEND_FILTER_BUDGET_INPUT,
  RECOMMEND_FILTER_BUDGET_PANEL,
  RECOMMEND_FILTER_BUDGET_RANGE,
  RECOMMEND_FILTER_OPTION_BASE,
  RECOMMEND_FILTER_PLATFORM_SELECTED,
  RECOMMEND_FILTER_PLATFORM_UNSELECTED,
  RECOMMEND_FILTER_PRESET_CARD,
  RECOMMEND_FILTER_TAG_ACTIVE,
  RECOMMEND_FILTER_TAG_INACTIVE,
  RECOMMEND_FILTER_TOGGLE_OFF,
  RECOMMEND_FILTER_TOGGLE_ON,
  RECOMMEND_FILTER_TOGGLE_TRACK_OFF,
  RECOMMEND_FILTER_TOGGLE_TRACK_ON,
} from "@/components/recommend/recommend-filter-styles";
import PlatformBrandIcon from "@/components/recommend/PlatformBrandIcon";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import PlanLimitReached from "@/components/PlanLimitReached";
import { useToast } from "@/components/ToastProvider";
import { trackProductEvent } from "@/lib/product-analytics/client";
import {
  LIMIT_TOAST_DURATION_MS,
  limitReachedToastMessage,
  isPremiumOrAdminPlan,
} from "@/lib/product-copy";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  isEmailVerified,
} from "@/lib/auth-email-verification";
import {
  PROMPT_MAX_ADMIN,
  PROMPT_MAX_DEFAULT,
} from "@/lib/recommend-limits";
import { EMAIL_NOT_VERIFIED_MESSAGE } from "@/lib/auth-email-verification";
import { persistFeedbackRecommendContextFromResults } from "@/lib/feedback-recommend-context";
import { hasMeaningfulRecommendInput } from "@/lib/recommend-input";
import {
  clearRecommendSessionState,
  loadRecommendSessionState,
  RECOMMEND_SESSION_STORAGE_VERSION,
  saveRecommendSessionState,
  type RecommendSessionSnapshot,
} from "@/lib/recommend-session-state";
import {
  resolveRecommendFitBody,
  sanitizeRecommendFitCopy,
} from "@/lib/recommend-fit-display";
import { supabase } from "@/lib/supabase";
import ExportSocialCardsButton from "@/components/social/ExportSocialCardsButton";
import { canShowSocialExport } from "@/lib/social-export-access";
import { REFINE_MESSAGE_MAX } from "@/lib/recommend-refine";
import {
  prefersItalianRecommendCopy,
  resolveRecommendResultBudgetLine,
} from "@/lib/recommend-result-card-budget";
import PingRecommendExperience from "@/components/ping/PingRecommendExperience";
import type { PingAssistantState } from "@/components/ping/PingAssistant";
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

function isRecommendRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/recommend" || pathname.endsWith("/recommend");
}

function buildPingInspectMessage(game: Game): string {
  const reason = resolveRecommendFitBody(game.reason);
  const short =
    reason.length > 120 ? `${reason.slice(0, 117).trimEnd()}…` : reason;
  return `This fits because ${short}`;
}

function pingAssistantStateFromUi(
  loading: boolean,
  gamesCount: number,
  inspectedGameIndex: number | null,
  showPromptInput: boolean,
  promptHasText: boolean
): PingAssistantState {
  if (inspectedGameIndex !== null && gamesCount > 0) return "inspecting";
  if (loading) return "searching";
  if (gamesCount > 0) return "complete";
  if (showPromptInput && promptHasText) return "typing";
  return "awake";
}

function pingAssistantMessageFromUi(
  state: PingAssistantState,
  games: Game[],
  inspectedGameIndex: number | null,
  askedPrompt: string | null
): string {
  if (state === "inspecting" && inspectedGameIndex !== null) {
    const game = games[inspectedGameIndex];
    if (game) return buildPingInspectMessage(game);
  }
  if (state === "searching") return "Scanning your request…";
  if (state === "complete") return "Found a few strong matches.";
  if (askedPrompt) return "What are we looking for today?";
  return "What are we looking for today?";
}

function isHoverCapablePointer(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: hover)").matches;
}

export default function RecommendPage() {
  const pathname = usePathname();
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
  const [emailVerifiedForFeatures, setEmailVerifiedForFeatures] = useState(true);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [promptMaxForUi, setPromptMaxForUi] = useState(PROMPT_MAX_DEFAULT);
  const [refineInput, setRefineInput] = useState("");
  const [refineUsed, setRefineUsed] = useState(false);
  // True only while a refine request is in flight. Lets us keep the previous
  // result cards visible (with an "Updating…" hint) instead of swapping them
  // for the full-screen skeleton the way an initial search does.
  const [refining, setRefining] = useState(false);
  const [pingModeParam, setPingModeParam] = useState(false);
  const [pingQueryParam, setPingQueryParam] = useState<string | null>(null);
  const [pingEditing, setPingEditing] = useState(false);
  const [inspectedGameIndex, setInspectedGameIndex] = useState<number | null>(null);
  const pingAutoRunRef = useRef(false);
  const loadingRef = useRef(false);

  function buildRecommendSessionSnapshot(
    overrides: Partial<RecommendSessionSnapshot> = {}
  ): RecommendSessionSnapshot {
    return {
      version: RECOMMEND_SESSION_STORAGE_VERSION,
      form: { ...form },
      filtersEnabled,
      games,
      noStrongMatchesAfterSuccess,
      resultsReveal,
      refineUsed,
      ...overrides,
    };
  }

  function persistRecommendSession(overrides: Partial<RecommendSessionSnapshot> = {}) {
    const snapshot = buildRecommendSessionSnapshot(overrides);
    const hasResults = snapshot.games.length > 0;
    const hasInput = hasMeaningfulRecommendInput(snapshot.form, snapshot.filtersEnabled);
    if (!hasResults && !hasInput) return;
    saveRecommendSessionState(snapshot);
  }

  const applyRecommendSessionSnapshot = useCallback((stored: RecommendSessionSnapshot) => {
    setForm(stored.form);
    setFiltersEnabled(stored.filtersEnabled);
    setGames(stored.games);
    setNoStrongMatchesAfterSuccess(stored.noStrongMatchesAfterSuccess);
    setDailyLimitReached(false);
    setDailyLimitContext(null);
    setResultsReveal(stored.resultsReveal || stored.games.length > 0);
    setRefineUsed(stored.refineUsed);
    setLoading(false);
    setLoadingStepIndex(0);
  }, []);

  const syncRecommendSessionFromStorage = useCallback(() => {
    if (loadingRef.current) return;
    const stored = loadRecommendSessionState();
    if (!stored) return;
    applyRecommendSessionSnapshot(stored);
  }, [applyRecommendSessionSnapshot]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  /* Before paint: hydrate from sessionStorage (F5, client nav, browser back). */
  useLayoutEffect(() => {
    if (!isRecommendRoute(pathname)) return;
    /* eslint-disable react-hooks/set-state-in-effect -- sync sessionStorage → React on navigation/back */
    syncRecommendSessionFromStorage();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname, syncRecommendSessionFromStorage]);

  /* bfcache / browser back can restore an old in-memory tree without re-running mount effects. */
  useEffect(() => {
    const onPageShow = () => {
      if (!isRecommendRoute(window.location.pathname)) return;
      syncRecommendSessionFromStorage();
    };
    const onPopState = () => {
      if (!isRecommendRoute(window.location.pathname)) return;
      syncRecommendSessionFromStorage();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname, syncRecommendSessionFromStorage]);

  useEffect(() => {
    if (loading) return;
    const snapshot = buildRecommendSessionSnapshot();
    const hasResults = snapshot.games.length > 0;
    const hasInput = hasMeaningfulRecommendInput(snapshot.form, snapshot.filtersEnabled);
    if (!hasResults && !hasInput) return;
    saveRecommendSessionState(snapshot);
  }, [
    form,
    filtersEnabled,
    games,
    noStrongMatchesAfterSuccess,
    resultsReveal,
    refineUsed,
    loading,
  ]);

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
        const plan = profile?.plan ?? "free";
        setUserPlan(plan);
        setEmailVerifiedForFeatures(
          isEmailVerified(data.user) || plan === "admin"
        );
        setPromptMaxForUi(
          plan === "admin" ? PROMPT_MAX_ADMIN : PROMPT_MAX_DEFAULT
        );
      } else {
        setLoggedUserId(null);
        setLoggedUserEmail(null);
        setEmailVerifiedForFeatures(true);
        setUserPlan(null);
        setPromptMaxForUi(PROMPT_MAX_DEFAULT);
      }
    }

    getUser();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      setPingModeParam(params.get("mode") === "ping");
      const q = params.get("q");
      setPingQueryParam(q ? decodeURIComponent(q) : null);
    });
  }, [pathname]);

  const pingModeActive = userPlan === "admin" && pingModeParam;
  const pingAskedPrompt = form.userPrompt.trim() || pingQueryParam?.trim() || null;
  const pingShowPromptInput =
    pingModeActive && (!pingAskedPrompt || pingEditing) && !loading;

  const pingAssistantState = useMemo(
    () =>
      pingAssistantStateFromUi(
        loading,
        games.length,
        inspectedGameIndex,
        pingShowPromptInput,
        Boolean(form.userPrompt.trim())
      ),
    [loading, games.length, inspectedGameIndex, pingShowPromptInput, form.userPrompt]
  );

  const pingAssistantMessage = useMemo(
    () =>
      pingAssistantMessageFromUi(
        pingAssistantState,
        games,
        inspectedGameIndex,
        pingAskedPrompt
      ),
    [pingAssistantState, games, inspectedGameIndex, pingAskedPrompt]
  );

  const handleCardInspectEnter = useCallback((index: number) => {
    if (!pingModeActive) return;
    setInspectedGameIndex(index);
  }, [pingModeActive]);

  const handleCardInspectLeave = useCallback(() => {
    if (!pingModeActive || !isHoverCapablePointer()) return;
    setInspectedGameIndex(null);
  }, [pingModeActive]);

  const handleCardInspectFocus = useCallback((index: number) => {
    if (!pingModeActive) return;
    setInspectedGameIndex(index);
  }, [pingModeActive]);

  const handleCardInspectBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      if (!pingModeActive) return;
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      if (isHoverCapablePointer()) setInspectedGameIndex(null);
    },
    [pingModeActive]
  );

  const handleCardInspectSelect = useCallback(
    (index: number) => {
      if (!pingModeActive || isHoverCapablePointer()) return;
      setInspectedGameIndex((prev) => (prev === index ? null : index));
    },
    [pingModeActive]
  );

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

  async function runRecommendSearch(promptOverride?: string) {
    if (submitBusyRef.current || loading) return;
    if (dailyLimitReached) return;
    if (loggedUserId && !emailVerifiedForFeatures) {
      showToast({ variant: "error", message: EMAIL_NOT_VERIFIED_MESSAGE });
      return;
    }

    const effectivePrompt =
      promptOverride !== undefined ? promptOverride : form.userPrompt;
    const effectiveForm = { ...form, userPrompt: effectivePrompt };

    if (!hasMeaningfulRecommendInput(effectiveForm, filtersEnabled)) {
      showToast({
        variant: "info",
        message: "Start with a vibe, genre, mood, or game idea first.",
      });
      return;
    }
    if (effectivePrompt.trim().length > promptMaxForUi) {
      showToast({
        variant: "error",
        message:
          promptMaxForUi <= PROMPT_MAX_DEFAULT
            ? "Prompt too long. Please keep it under 500 characters."
            : `Prompt too long. Keep it under ${promptMaxForUi} characters.`,
      });
      return;
    }

    if (promptOverride !== undefined) {
      setForm((prev) => ({ ...prev, userPrompt: effectivePrompt }));
    }

    clearRecommendSessionState();
    setRefineUsed(false);
    setRefineInput("");
    setPingEditing(false);
    submitBusyRef.current = true;
    setLoading(true);
    setInspectedGameIndex(null);
    setLoadingStepIndex(0);
    setResultsReveal(false);
    setNoStrongMatchesAfterSuccess(false);
    setEmailSaved(false);
    setApiDebug(null);

    const recommendStartedAt = performance.now();
    trackProductEvent("recommend_started");

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
        body: JSON.stringify({ ...effectiveForm, filtersEnabled }),
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

      const latencyMs = Math.round(performance.now() - recommendStartedAt);

      if (!res.ok) {
        trackProductEvent("recommend_failed", {
          metadata: {
            latencyMs,
            statusCode: res.status,
            errorType:
              typeof data?.error === "string" ? data.error : "http_error",
          },
        });
        if (res.status === 400 && data?.error === "prompt_too_long") {
          showToast({
            variant: "error",
            message:
              data.message ||
              "Prompt too long. Please keep it under 500 characters.",
          });
        } else if (res.status === 403 && data?.error === "email_not_verified") {
          showToast({
            variant: "error",
            message: data.message || EMAIL_NOT_VERIFIED_MESSAGE,
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
      trackProductEvent("recommend_completed", {
        metadata: {
          latencyMs,
          resultCount: nextGames.length,
          cacheHit: latencyMs < 1200,
        },
      });
      setGames(nextGames);
      setNoStrongMatchesAfterSuccess(nextGames.length === 0);
      const reveal = nextGames.length > 0;
      if (reveal) setResultsReveal(true);
      persistRecommendSession({
        form: effectiveForm,
        filtersEnabled,
        games: nextGames,
        noStrongMatchesAfterSuccess: nextGames.length === 0,
        resultsReveal: reveal,
      });
      persistFeedbackRecommendContextFromResults({
        prompt: effectivePrompt,
        games: nextGames,
        isRefine: false,
      });
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
      trackProductEvent("recommend_failed", {
        metadata: {
          latencyMs: Math.round(performance.now() - recommendStartedAt),
          statusCode: 0,
          errorType: "network_error",
        },
      });
      showToast({
        variant: "error",
        message: "Something went wrong. Check your connection and try again.",
      });
    } finally {
      submitBusyRef.current = false;
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runRecommendSearch();
  }

  useEffect(() => {
    if (!pingModeActive || pingAutoRunRef.current) return;
    const q = pingQueryParam?.trim();
    if (!q) return;
    if (userPlan !== "admin") return;

    pingAutoRunRef.current = true;
    queueMicrotask(() => {
      void runRecommendSearch(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot auto-run from URL q
  }, [pingModeActive, pingQueryParam, userPlan]);

  async function handleRefineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitBusyRef.current || loading || refineUsed || games.length === 0) return;
    if (dailyLimitReached) return;
    if (loggedUserId && !emailVerifiedForFeatures) {
      showToast({ variant: "error", message: EMAIL_NOT_VERIFIED_MESSAGE });
      return;
    }

    const refineMessage = refineInput.trim();
    if (!refineMessage) {
      showToast({
        variant: "info",
        message: "Add a short note about what to adjust — e.g. less famous or more story.",
      });
      return;
    }
    if (refineMessage.length > REFINE_MESSAGE_MAX) {
      showToast({
        variant: "error",
        message: `Keep your refinement under ${REFINE_MESSAGE_MAX} characters.`,
      });
      return;
    }

    submitBusyRef.current = true;
    setLoading(true);
    setRefining(true);
    setInspectedGameIndex(null);
    setLoadingStepIndex(0);
    // Keep the existing cards revealed during a refine (don't reset
    // resultsReveal); they stay on screen while the new picks load.
    setApiDebug(null);

    const recommendStartedAt = performance.now();
    trackProductEvent("recommend_started", {
      metadata: { refine: true },
    });

    try {
      const debugEnabled =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("debug") === "1";
      const endpoint = debugEnabled ? "/api/recommend?debug=1" : "/api/recommend";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          filtersEnabled,
          refineContext: {
            originalPrompt: form.userPrompt,
            previousResultTitles: games.map((g) => g.title),
            refineMessage,
          },
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        plan?: string;
        games?: Game[];
        debug?: RecommendDebug;
      };

      const latencyMs = Math.round(performance.now() - recommendStartedAt);

      if (!res.ok) {
        trackProductEvent("recommend_failed", {
          metadata: {
            latencyMs,
            statusCode: res.status,
            errorType:
              typeof data?.error === "string" ? data.error : "http_error",
            refine: true,
          },
        });
        if (res.status === 400 && data?.error === "refine_message_too_long") {
          showToast({
            variant: "error",
            message:
              data.message ||
              `Refinement is too long. Please keep it under ${REFINE_MESSAGE_MAX} characters.`,
          });
        } else if (res.status === 429 && data?.error === "daily_limit") {
          const limitPlan =
            typeof data.plan === "string" ? data.plan : userPlan;
          setDailyLimitContext({ plan: limitPlan, anonymous: !loggedUserId });
          setDailyLimitReached(true);
          const toast = limitReachedToastMessage({
            limitType: "daily_recommendations",
            plan: limitPlan,
            anonymous: !loggedUserId,
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
              "We couldn’t refine these picks. Try again in a moment.",
          });
        }
        return;
      }

      const nextGames = data.games ?? [];
      trackProductEvent("recommend_completed", {
        metadata: {
          latencyMs,
          resultCount: nextGames.length,
          refine: true,
        },
      });
      setGames(nextGames);
      setRefineUsed(true);
      setNoStrongMatchesAfterSuccess(nextGames.length === 0);
      const reveal = nextGames.length > 0;
      if (reveal) setResultsReveal(true);
      persistRecommendSession({
        games: nextGames,
        noStrongMatchesAfterSuccess: nextGames.length === 0,
        resultsReveal: reveal,
        refineUsed: true,
      });
      persistFeedbackRecommendContextFromResults({
        prompt: form.userPrompt,
        games: nextGames,
        isRefine: true,
        originalPrompt: form.userPrompt,
        refineMessage,
      });
      if (debugEnabled && data?.debug) {
        setApiDebug(data.debug as RecommendDebug);
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setRefining(false);
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

    if (loggedUserId && !emailVerifiedForFeatures) {
      showToast({ variant: "error", message: EMAIL_NOT_VERIFIED_MESSAGE });
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
        if (result.error === "email_not_verified") {
          showToast({
            variant: "error",
            message: result.message || EMAIL_NOT_VERIFIED_MESSAGE,
          });
        } else if (result.error === "limit_reached") {
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

  function renderRecommendBody() {
    return (
      <>
          {!pingModeActive && (
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-green-400">
                Recommendations
              </p>

              <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white gp-home-display md:text-6xl">
                Find the game you actually feel like playing.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                {filtersEnabled
                  ? "Use filters when you want tighter picks. Verified prices live on each game page."
                  : "Describe the kind of game you want in your own words. Turn on Advanced filters for budget, tags, or platform."}
              </p>
            </div>

            <div className={`${APP_CARD} p-6`}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-300">
                Tips
              </p>

              <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
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
          )}

          {!pingModeActive && (
          <form
            onSubmit={handleSubmit}
            className="mt-12 space-y-6"
            aria-busy={loading}
          >
            <section className={`${APP_CARD_LG} p-6 md:p-8`}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--page-accent-text)]">
                Start here
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                What do you want to play?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
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
                className={`gp-prompt-textarea ${APP_INPUT} mt-6 min-h-52 resize-y p-5 text-[15px] leading-7 ${
                  promptScrollable ? "overflow-y-auto" : "overflow-y-hidden"
                }`}
                value={form.userPrompt}
                onChange={(e) => {
                  updateField("userPrompt", e.target.value);
                  requestAnimationFrame(() => {
                    const el = promptTextareaRef.current;
                    if (!el) return;
                    setPromptScrollable(el.scrollHeight > el.clientHeight + 1);
                  });
                }}
              />

              <p
                className={`mt-2 text-xs tabular-nums ${
                  form.userPrompt.length > promptMaxForUi
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-600 dark:text-slate-300"
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
                  className={`flex max-w-full items-center gap-3 rounded-full border px-5 py-3 text-left text-sm font-semibold transition ${
                    filtersEnabled ? RECOMMEND_FILTER_TOGGLE_ON : RECOMMEND_FILTER_TOGGLE_OFF
                  }`}
                >
                  <span
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors ${
                      filtersEnabled
                        ? RECOMMEND_FILTER_TOGGLE_TRACK_ON
                        : RECOMMEND_FILTER_TOGGLE_TRACK_OFF
                    }`}
                  >
                    <span className="inline-block h-7 w-7 rounded-full bg-white shadow" />
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
            <section className={`${APP_CARD_LG} p-6 md:p-8`}>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-700 dark:text-green-400">
                Quick presets
              </p>

              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                Start from a preset vibe
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {presets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={RECOMMEND_FILTER_PRESET_CARD}
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{preset.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {preset.text}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className={`${APP_CARD_LG} p-6 md:p-8`}>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-700 dark:text-green-400">
                  Platform
                </p>

                <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Where do you want to play?</h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.name}
                      type="button"
                      aria-pressed={form.platform === platform.name}
                      onClick={() =>
                        updateField(
                          "platform",
                          form.platform === platform.name ? "" : platform.name
                        )
                      }
                      className={`${RECOMMEND_FILTER_OPTION_BASE} ${
                        form.platform === platform.name
                          ? RECOMMEND_FILTER_PLATFORM_SELECTED
                          : RECOMMEND_FILTER_PLATFORM_UNSELECTED
                      }`}
                    >
                      <div className="h-8 w-8 text-[color:var(--page-accent-text)]">
                        <PlatformBrandIcon src={platform.icon} alt={platform.name} />
                      </div>
                      <div className="mt-4 font-bold text-slate-900 dark:text-white">{platform.name}</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {platform.text}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${APP_CARD_LG} p-6 md:p-8`}>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-700 dark:text-green-400">
                  Budget
                </p>

                <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                  What&apos;s your max budget?
                </h2>

                <div className={`mt-8 ${RECOMMEND_FILTER_BUDGET_PANEL}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">$0</span>
                    <span className="rounded-full bg-green-50/80 px-5 py-2 text-lg font-extrabold text-green-700 ring-1 ring-green-200/80 backdrop-blur-sm dark:bg-green-950/40 dark:text-green-300 dark:ring-green-500/30">
                      ${form.budget || "0"}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">$80</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    aria-label="Maximum budget in dollars (slider)"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    className={RECOMMEND_FILTER_BUDGET_RANGE}
                  />

                  <input
                    type="number"
                    placeholder="e.g. 20"
                    aria-label="Maximum budget in dollars"
                    className={RECOMMEND_FILTER_BUDGET_INPUT}
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className={`${APP_CARD_LG} p-6 md:p-8`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-700 dark:text-green-400">
                    Taste builder
                  </p>

                  <h2 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                    Pick a few tags
                  </h2>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    You don&apos;t need all of them. 3–8 tags is perfect.
                  </p>
                </div>

              <div className="mt-8 space-y-8">
                {tagGroups
                  .map((group) => (
                    <div key={group.key}>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{group.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
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
                              className={`inline-flex min-h-[2.5rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-transparent px-4 py-2 text-sm font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)] ${
                                active
                                  ? RECOMMEND_FILTER_TAG_ACTIVE
                                  : RECOMMEND_FILTER_TAG_INACTIVE
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

            <div className={`${APP_CARD} p-5 md:p-6`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Ready to discover your picks?
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Up to five curated matches with scores and clear reasons. Check deals on
                    each game page.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || dailyLimitReached}
                  aria-disabled={loading || dailyLimitReached}
                  className={`shrink-0 ${APP_PRIMARY_CTA_LG} disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {dailyLimitReached
                    ? "Daily limit reached"
                    : loading
                      ? "Finding your picks..."
                      : "Get my picks"}
                </button>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-center text-sm leading-6 text-slate-300 md:mx-auto">
              You can try recommendations without logging in. Create a free account to save
              searches and track game deals.
            </p>
          </form>
          )}

          {dailyLimitReached && (
            <PlanLimitReached
              limitType="daily_recommendations"
              plan={dailyLimitContext?.plan ?? userPlan}
              anonymous={dailyLimitContext?.anonymous ?? !loggedUserId}
              className="mx-auto mt-8 max-w-xl"
            />
          )}

          {loading && !refining && !pingModeActive && (
            <div
              className="mt-10 md:mt-12"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="mx-auto max-w-xl px-1">
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Working on it
                </p>

                <p
                  key={loadingStepIndex}
                  className="gp-recommend-step-animate mb-3 text-center text-[15px] font-bold leading-snug tracking-tight text-green-300 md:text-lg md:leading-snug"
                >
                  {RECOMMEND_LOADING_STEPS[loadingStepIndex]}
                </p>

                <div
                  className="mx-auto mb-6 h-1 max-w-[220px] overflow-hidden rounded-full bg-white/15"
                  aria-hidden="true"
                >
                  <div className="h-full w-full animate-pulse rounded-full bg-green-400/70 motion-reduce:animate-none" />
                </div>

                <ul className="mb-8 space-y-2.5 text-center text-[13px] leading-relaxed text-slate-300 md:text-sm md:leading-relaxed">
                  {RECOMMEND_LOADING_HELPERS.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <section className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="gp-recommend-skeleton-bar gp-game-skeleton-bar-light relative h-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white animate-pulse motion-reduce:animate-none"
                  />
                ))}
              </section>
            </div>
          )}

          {!loading && noStrongMatchesAfterSuccess && games.length === 0 && (
            <div
              ref={emptyResultsRef}
              className={`mt-14 ${APP_CARD_LG} p-8 md:p-10`}
              role="status"
              aria-live="polite"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-700 dark:text-green-400">
                No picks this round
              </p>
              <h2 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">
                We couldn&apos;t find strong matches for this vibe yet.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
                That doesn&apos;t mean your taste is wrong—sometimes the best move is a sharper
                prompt, looser filters, or a different angle. Try describing mood, pacing, or a
                reference game you love.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a href="#recommend-prompt" className={APP_PRIMARY_CTA_SM}>
                  Try another vibe
                </a>
                <Link href="/curated" className={APP_SECONDARY_CTA}>
                  Browse curated lists
                </Link>
                <Link href="/games" className={APP_SECONDARY_CTA}>
                  Explore games A–Z
                </Link>
              </div>
            </div>
          )}

          {games.length > 0 && (!loading || refining) && (
            <div
              ref={resultsRef}
              aria-busy={refining}
              className={`transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
                refining
                  ? "opacity-60"
                  : resultsReveal
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
              }`}
            >
              <div className="mt-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-400">
                    Your picks
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white gp-home-display">
                    Curated for your search
                  </h2>
                  {refining && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-200"
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 motion-reduce:animate-none"
                      />
                      Updating your picks…
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={copyResults}
                    className="text-xs font-semibold text-slate-300 underline-offset-2 transition hover:text-white hover:underline"
                  >
                    Copy results
                  </button>
                  {canShowSocialExport(userPlan) ? (
                    <ExportSocialCardsButton
                      prompt={form.userPrompt}
                      games={games}
                      hasBudgetFilter={Boolean(form.budget.trim())}
                    />
                  ) : null}
                </div>
              </div>

              {apiDebug && (
                <div className={`mt-5 ${APP_CARD} p-4 text-sm text-slate-700 dark:text-slate-300`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-slate-300">
                    Debug
                  </p>
                  <p className="mt-2">
                    Resolved input:{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {apiDebug.resolvedInput || "(none)"}
                    </span>
                  </p>
                  <p className="mt-2">
                    API finalResponse titles ({apiDebug.finalResponse?.count ?? "?"}
                    ):{" "}
                    <span className="text-slate-700">
                      {(apiDebug.finalResponse?.titles || []).join(" • ") || "(none)"}
                    </span>
                  </p>
                  <p className="mt-2">
                    UI rendered titles ({games.length}):{" "}
                    <span className="text-slate-700">
                      {games.map((g) => g.title).join(" • ")}
                    </span>
                  </p>
                </div>
              )}

              <section className="mt-6 grid items-stretch gap-6 md:grid-cols-2">
                {games.map((game, index) => (
                  <div
                    key={`${game.title}-${index}`}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-[#0a0b14]/60 dark:shadow-none dark:backdrop-blur-md ${
                      pingModeActive && inspectedGameIndex === index
                        ? "border-violet-400/50 ring-2 ring-violet-400/25"
                        : "border-slate-200/90 hover:border-green-400/60 dark:border-white/10 dark:hover:border-green-500/40"
                    }`}
                    {...(pingModeActive
                      ? {
                          tabIndex: 0,
                          onMouseEnter: () => handleCardInspectEnter(index),
                          onMouseLeave: handleCardInspectLeave,
                          onFocus: () => handleCardInspectFocus(index),
                          onBlur: handleCardInspectBlur,
                          onClick: () => handleCardInspectSelect(index),
                        }
                      : {})}
                  >
                    {game.image ? (
                      <div className="h-52 w-full overflow-hidden bg-slate-100 dark:bg-black/40">
                        <img
                          src={game.image}
                          alt={game.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-sm text-slate-600 dark:bg-black/40 dark:text-white/70">
                        No image available
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tabular-nums text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                          #{index + 1}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{game.title}</h2>

                      {(() => {
                        const fitNote = sanitizeRecommendFitCopy(game.matchNote);
                        return fitNote ? (
                          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{fitNote}</p>
                        ) : null;
                      })()}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {game.matchTier === "good_alternative" && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25">
                            Good alternative
                          </span>
                        )}
                        {game.matchTier === "partial_match" && (
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/25">
                            Partial match
                          </span>
                        )}
                        {game.matchTier === "best_match" && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25">
                            Best match
                          </span>
                        )}
                        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold tabular-nums text-green-800 ring-1 ring-green-200/80 dark:bg-green-500/15 dark:text-green-200 dark:ring-green-500/25">
                          {game.match}% match
                        </span>
                      </div>

                      {(() => {
                        const budgetLine = resolveRecommendResultBudgetLine({
                          budgetNote: game.budgetNote,
                          hasBudgetFilter: Boolean(form.budget.trim()),
                          preferItalian: prefersItalianRecommendCopy(form.userPrompt),
                        });
                        return budgetLine ? (
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{budgetLine}</p>
                        ) : null;
                      })()}

                      <div className="mt-4 flex flex-1 flex-col">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
                          Why it fits
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {resolveRecommendFitBody(game.reason)}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Based on this search — not your saved Gaming DNA yet.
                        </p>
                      </div>

                      <div className="mt-auto border-t border-slate-200 pt-5 dark:border-white/10">
                        <a
                          href={gameDetailHrefFromRecommend(game)}
                          onClick={() => persistRecommendSession()}
                          className={APP_PRIMARY_CTA_ACCENT_SM}
                        >
                          View details
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {refineUsed ? (
                <div className={`mt-8 ${APP_CARD} p-5 text-center`}>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    You used your one refinement for this search.
                  </p>
                  <a
                    href="#recommend-prompt"
                    className={`mt-4 inline-flex ${APP_SECONDARY_CTA}`}
                  >
                    Start a new search
                  </a>
                </div>
              ) : (
                <form
                  onSubmit={handleRefineSubmit}
                  className={`mt-8 ${APP_CARD} p-5 md:p-6`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-700 dark:text-green-400">
                    Not quite right?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Tell GamePing what to adjust. You get one refinement for this search.
                  </p>
                  <label className="mt-4 block">
                    <span className="sr-only">Refine your picks</span>
                    <input
                      type="text"
                      value={refineInput}
                      onChange={(e) => setRefineInput(e.target.value)}
                      maxLength={REFINE_MESSAGE_MAX}
                      disabled={loading}
                      placeholder="e.g. less famous, more story, not multiplayer…"
                      className={`${APP_INPUT} text-sm disabled:opacity-50`}
                    />
                  </label>
                  <p
                    className={`mt-2 text-xs tabular-nums ${
                      refineInput.length > REFINE_MESSAGE_MAX
                        ? "text-rose-600"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {refineInput.length} / {REFINE_MESSAGE_MAX}
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !refineInput.trim()}
                    className={`mt-4 w-full sm:w-auto ${APP_PRIMARY_CTA_SM} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Refine picks
                  </button>
                </form>
              )}

              <form
                onSubmit={handleEmailSubmit}
                className={`mt-10 ${APP_CARD_LG} p-6 md:p-7`}
              >
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Save these picks</h2>

                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  Save this search to your dashboard and revisit these picks later. Track prices
                  from each game&apos;s detail page.
                </p>

                {loggedUserEmail && (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    Saving for: <span className="font-semibold text-green-700 dark:text-green-400">{loggedUserEmail}</span>
                  </p>
                )}

                <div className="mt-6">
                  {loggedUserEmail ? (
                    <button type="submit" className={APP_SECONDARY_CTA}>
                      Save recommendations
                    </button>
                  ) : (
                    <a href="/login?redirect=%2Frecommend" className={APP_PRIMARY_CTA_LG}>
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
                <p className={`mt-4 ${APP_MUTED}`}>
                  {!loggedUserId
                    ? "Try GamePing without an account: 3 searches/day."
                    : isPremiumOrAdminPlan(userPlan)
                      ? "Premium: 50 recommendations/day, 25 saved searches, 50 tracked games, plus your GamePing DNA."
                      : "Free: 10 recommendations/day, 3 saved searches, 5 tracked games."}
                </p>
              )}
            </div>
          )}
      </>
    );
  }

  return (
    <AppPageShell navbarCtaLabel="Home" navbarCtaHref="/" hideAmbient>
      <section className="gp-recommend relative z-10 overflow-hidden px-6 py-16">
        {/* Fixed cinematic background — SAME image in light + dark (see
         * recommend-page.css); only surfaces/text/accents change with theme. */}
        <div aria-hidden className="gp-recommend-bg" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <EmailVerificationNotice className="mb-8" theme="dark" />

          {pingModeActive ? (
            <PingRecommendExperience
              assistantState={pingAssistantState}
              assistantMessage={pingAssistantMessage}
              askedPrompt={
                pingAskedPrompt && !pingShowPromptInput ? pingAskedPrompt : null
              }
              showPromptInput={pingShowPromptInput}
              promptValue={form.userPrompt}
              onPromptChange={(value) => updateField("userPrompt", value)}
              onPromptSubmit={() => void runRecommendSearch()}
              onEditPrompt={
                pingAskedPrompt && !pingShowPromptInput && !loading
                  ? () => setPingEditing(true)
                  : undefined
              }
              promptMax={promptMaxForUi}
              promptDisabled={loading || dailyLimitReached}
            >
              {renderRecommendBody()}
            </PingRecommendExperience>
          ) : (
            renderRecommendBody()
          )}
        </div>
      </section>
    </AppPageShell>
  );
}