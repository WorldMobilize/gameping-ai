"use client";

import { useEffect, useRef, useState } from "react";
import { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD_LG,
  APP_INPUT,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";
import type { CompanionAnswer, CompanionMode } from "@/lib/companion/types";

type GameSuggestion = {
  id: number;
  name: string;
  released: string | null;
  image: string | null;
};

const MODES: { value: CompanionMode; label: string; blurb: string }[] = [
  { value: "hint", label: "Hint", blurb: "Nudges only — no spoilers" },
  { value: "guide", label: "Guide", blurb: "What to do — minor spoilers" },
  { value: "full", label: "Full solution", blurb: "Complete answer & locations" },
];

const EXAMPLE_QUESTIONS = [
  "I just defeated Rennala, where should I go?",
  "Where do I find this weapon?",
  "Best beginner build?",
  "What secrets did I miss here?",
];

export default function CompanionView() {
  const [gameTitle, setGameTitle] = useState("");
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<CompanionMode>("guide");

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<CompanionAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The input the user is actively editing; suggestions track it (debounced).
  const justPickedRef = useRef(false);

  useEffect(() => {
    const term = gameTitle.trim();
    if (justPickedRef.current) {
      // A suggestion was just clicked — don't immediately re-search it.
      justPickedRef.current = false;
      return;
    }
    let cancelled = false;
    // Reset/fetch runs inside the timer callback (not synchronously in the
    // effect body): clear immediately when the term is too short, otherwise
    // debounce the lookup. Behavior is unchanged.
    const handle = setTimeout(
      async () => {
        if (term.length < 2) {
          if (!cancelled) setSuggestions([]);
          return;
        }
        try {
          const res = await fetch(
            `/api/admin/companion?q=${encodeURIComponent(term)}`
          );
          if (!res.ok) return;
          const data = (await res.json()) as { results?: GameSuggestion[] };
          if (cancelled) return;
          setSuggestions(Array.isArray(data.results) ? data.results : []);
          setShowSuggestions(true);
        } catch {
          // RAWG is optional in Alpha — free-text game entry still works.
        }
      },
      term.length < 2 ? 0 : 300
    );
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [gameTitle]);

  function pickSuggestion(name: string) {
    justPickedRef.current = true;
    setGameTitle(name);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function ask() {
    const trimmedGame = gameTitle.trim();
    const trimmedQuestion = question.trim();
    if (!trimmedGame || !trimmedQuestion || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setShowSuggestions(false);

    try {
      const res = await fetch("/api/admin/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: trimmedGame,
          question: trimmedQuestion,
          mode,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        answer?: CompanionAnswer;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.answer) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setAnswer(data.answer);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const canAsk = gameTitle.trim().length > 0 && question.trim().length > 0;

  return (
    <AppSection maxWidth="max-w-3xl">
      {/* Hero */}
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
        In-browser tester
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
        GamePing <span className="text-[color:var(--page-accent-strong)]">Companion</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
        An AI companion that helps while you&apos;re playing. Pick a game, ask anything, and choose
        how much you want spoiled.
      </p>

      {/* Composer */}
      <div className={`mt-10 ${APP_CARD_LG}`}>
        {/* 1 — Game */}
        <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
          1 · Game
        </label>
        <div className="relative mt-2">
          <input
            type="text"
            value={gameTitle}
            onChange={(e) => {
              setGameTitle(e.target.value);
            }}
            onFocus={() => {
              if (suggestions.length) setShowSuggestions(true);
            }}
            placeholder="Search a game (e.g. Elden Ring) — or just type a title"
            className={APP_INPUT}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(s.name)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.released ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {s.released.slice(0, 4)}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* 2 — Question */}
        <label className="mt-6 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          2 · Your question
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="e.g. I just defeated Rennala, where should I go?"
          className={`mt-2 ${APP_INPUT} resize-y`}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuestion(ex)}
              className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-text)] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* 3 — Spoiler mode */}
        <label className="mt-6 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          3 · Spoiler control
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                aria-pressed={active}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] shadow-[0_6px_18px_-8px_var(--page-accent-glow)]"
                    : "border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-600"
                }`}
              >
                <span
                  className={`block text-sm font-bold ${
                    active
                      ? "text-[color:var(--page-accent-text)]"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {m.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
                  {m.blurb}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={ask}
            disabled={!canAsk || loading}
            className={`${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? "Thinking…" : "Ask the companion"}
          </button>
          <span className={APP_MUTED}>Admin-only experiment · responses may be imperfect</span>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-300/70 bg-rose-50/80 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {/* Answer */}
      {answer ? <AnswerCard answer={answer} /> : null}

    </AppSection>
  );
}

function AnswerCard({ answer }: { answer: CompanionAnswer }) {
  return (
    <div className={`mt-6 ${APP_CARD_LG}`}>
      {answer.uncertain ? (
        <div className="mb-5 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="font-semibold">Double-check this.</span>{" "}
          {answer.uncertaintyNote ||
            "Some details may vary by version, patch, or platform — verify in-game."}
        </div>
      ) : null}

      {answer.shortAnswer ? (
        <p className="text-lg font-semibold leading-7 text-slate-900 dark:text-white">
          {answer.shortAnswer}
        </p>
      ) : null}

      <AnswerList title="Next steps" items={answer.nextSteps} accent />
      <AnswerList title="Don't miss" items={answer.dontMiss} />
      <AnswerList title="Warnings" items={answer.warnings} tone="warning" />
      <AnswerList title="Extra tips" items={answer.extraTips} />
    </div>
  );
}

function AnswerList({
  title,
  items,
  accent = false,
  tone,
}: {
  title: string;
  items: string[];
  accent?: boolean;
  tone?: "warning";
}) {
  if (!items.length) return null;
  const dot =
    tone === "warning"
      ? "bg-amber-500"
      : accent
        ? "bg-[color:var(--page-accent-strong)]"
        : "bg-slate-400 dark:bg-slate-500";
  return (
    <div className="mt-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="flex gap-3">
            <span aria-hidden className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
