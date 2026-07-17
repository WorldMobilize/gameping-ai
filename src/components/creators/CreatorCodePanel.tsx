"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Creator-side "Earn" panel. Flow: intro → pick a type (radio list) → create →
 * the generated code card. Client component; reads/writes via /api/creator/code
 * (gated by CREATOR_PROGRAM_ENABLED server-side).
 */

type CodeType = "referral" | "discount" | "trial";

const OPTIONS: { type: CodeType; title: string; blurb: string }[] = [
  {
    type: "referral",
    title: "Standard code",
    blurb: "No discount — you earn commission on the full $7.99.",
  },
  {
    type: "discount",
    title: "20% off for your audience",
    blurb: "Followers pay $6.39 — you earn on the discounted price.",
  },
  {
    type: "trial",
    title: "7 days free",
    blurb: "Followers get a 7-day trial — you earn once they convert.",
  },
];

const TYPE_LABEL: Record<CodeType, string> = {
  referral: "Standard code",
  discount: "20% off",
  trial: "7-day trial",
};

const CARD =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70";
const PRIMARY =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100";

export default function CreatorCodePanel() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState<{ code: string; type: CodeType } | null>(null);
  const [stage, setStage] = useState<"intro" | "choosing">("intro");
  const [selected, setSelected] = useState<CodeType | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    let off = false;
    fetch("/api/creator/code", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (off) return;
        setEnabled(Boolean(d.enabled));
        setCode(d.code ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!off) setLoading(false);
      });
    return () => {
      off = true;
    };
  }, []);

  async function create() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/creator/code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selected }),
      });
      const d = (await res.json().catch(() => ({}))) as { code?: string };
      if (res.ok && d.code) {
        setCode({ code: d.code, type: selected });
        setStage("intro");
        setSelected(null);
      }
    } finally {
      setBusy(false);
    }
  }

  function startChoosing() {
    setSelected(code?.type ?? null);
    setStage("choosing");
  }

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  if (loading) return null;

  // Flag off (e.g. production before launch): keep the old waitlist CTA.
  if (!enabled) {
    return (
      <div className="mt-8 flex flex-col items-start gap-3">
        <Link href="/contact" className={PRIMARY}>
          Apply / join waitlist
        </Link>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Applications open soon — join the waitlist to be first in line.
        </span>
      </div>
    );
  }

  // Step 2 — pick a type (radio list) + proceed.
  if (stage === "choosing") {
    return (
      <div className="mt-8 max-w-xl">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Choose the code your audience gets:
        </p>
        <div className="mt-4 flex flex-col gap-1">
          {OPTIONS.map((o) => (
            <label
              key={o.type}
              className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <input
                type="radio"
                name="creator-code-type"
                checked={selected === o.type}
                onChange={() => setSelected(o.type)}
                className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
              />
              <span>
                <span className="block text-base font-bold text-slate-900 dark:text-white">
                  {o.title}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                  {o.blurb}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button type="button" onClick={create} disabled={!selected || busy} className={PRIMARY}>
            {busy ? "Creating…" : "Create my code"}
          </button>
          {code ? (
            <button
              type="button"
              onClick={() => {
                setStage("intro");
                setSelected(null);
              }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // Existing code → the code card (with a way to change type).
  if (code) {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/upgrade?ref=${code.code}`
        : "";
    return (
      <div className={`mt-8 max-w-xl ${CARD}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
          Your creator code · {TYPE_LABEL[code.type]}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-slate-100 px-4 py-2 font-mono text-2xl font-bold tracking-widest text-slate-900 dark:bg-white/10 dark:text-white">
            {code.code}
          </span>
          <button
            type="button"
            onClick={() => copy(code.code, "code")}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {copied === "code" ? "Copied!" : "Copy code"}
          </button>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          Share this link
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="max-w-full truncate rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={() => copy(shareUrl, "link")}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-white/5"
          >
            {copied === "link" ? "Copied!" : "Copy link"}
          </button>
        </div>

        <button
          type="button"
          onClick={startChoosing}
          className="mt-6 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
        >
          Change code type
        </button>
      </div>
    );
  }

  // Step 1 — intro (no code yet).
  return (
    <div className="mt-8 max-w-xl">
      <p className="text-base text-slate-600 dark:text-slate-400">
        Ready to earn? Create your personal code and start sharing it with your audience.
      </p>
      <button type="button" onClick={startChoosing} className={`mt-5 ${PRIMARY}`}>
        Get your creator code
      </button>
    </div>
  );
}
