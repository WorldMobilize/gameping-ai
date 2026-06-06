import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_INTENT_SIGNALS,
  detectIntentSignals,
} from "./intent-normalization.ts";
import {
  applyDiversityScoreAdjustments,
  balanceFinalPicksDiversity,
  buildDiversityContext,
  isCanonicalAnchorTitle,
  isFamousIndieForObscurePrompt,
  popularityWeightMultiplier,
  type DiversityPick,
} from "./recommend-diversity-core.ts";

function sig(overrides: Partial<typeof EMPTY_INTENT_SIGNALS> = {}) {
  return { ...EMPTY_INTENT_SIGNALS, ...overrides };
}

function mockCandidate(name: string, extra: Record<string, unknown> = {}) {
  return {
    id: name.length * 17,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    background_image: "https://example.com/img.jpg",
    added: 1000,
    ratings_count: 500,
    rating: 4.2,
    ...extra,
  };
}

function pick(
  title: string,
  match: number,
  tier: DiversityPick["matchTier"] = "best_match"
): DiversityPick {
  return {
    id: title.length * 13,
    title,
    slug: null,
    image: null,
    match,
    reason: `Fits ${title}`,
    matchTier: tier,
    matchNote: "",
  };
}

describe("buildDiversityContext", () => {
  it("activates anti safe-pick fatigue for broad emotional prompts", () => {
    const prompt = "Games that make you love gaming again";
    const ctx = buildDiversityContext({
      userPrompt: prompt,
      signals: detectIntentSignals(prompt),
    });
    assert.equal(ctx.antiSafePickFatigue, true);
    assert.equal(ctx.obscureDiscovery, false);
    assert.equal(ctx.classicListRequest, false);
  });

  it("disables fatigue for explicit games-like requests", () => {
    const prompt = "Games like Journey";
    const ctx = buildDiversityContext({
      userPrompt: prompt,
      signals: detectIntentSignals(prompt),
      referenceTitles: ["Journey"],
    });
    assert.equal(ctx.explicitLikeRequest, true);
    assert.equal(ctx.antiSafePickFatigue, false);
  });

  it("allows classics for best-games-ever prompts", () => {
    const prompt = "Best games ever made";
    const ctx = buildDiversityContext({
      userPrompt: prompt,
      signals: detectIntentSignals(prompt),
    });
    assert.equal(ctx.classicListRequest, true);
    assert.equal(ctx.antiSafePickFatigue, false);
  });

  it("activates obscure discovery for hidden gem prompts", () => {
    const prompt = "Weird underrated hidden gems";
    const ctx = buildDiversityContext({
      userPrompt: prompt,
      signals: detectIntentSignals(prompt),
    });
    assert.equal(ctx.obscureDiscovery, true);
  });

  it("activates obscure discovery for not-usual-indie prompts", () => {
    const prompt =
      "I want something emotional but not the usual indie recommendations";
    const ctx = buildDiversityContext({
      userPrompt: prompt,
      signals: detectIntentSignals(prompt),
    });
    assert.equal(ctx.obscureDiscovery, true);
  });

  it("recognizes expanded famous indie canon for obscure mode", () => {
    assert.equal(isFamousIndieForObscurePrompt("Night in the Woods"), true);
    assert.equal(isFamousIndieForObscurePrompt("Oxenfree"), true);
    assert.equal(isFamousIndieForObscurePrompt("What Remains of Edith Finch"), true);
    assert.equal(isFamousIndieForObscurePrompt("A Short Hike"), true);
  });
});

describe("popularityWeightMultiplier", () => {
  it("lowers popularity weight for obscure and fatigue prompts", () => {
    const obscure = buildDiversityContext({
      userPrompt: "hidden gems",
      signals: sig({ discoverySubkind: "underrated", memorableDiscovery: true }),
    });
    const fatigue = buildDiversityContext({
      userPrompt: "games that make you love gaming again",
      signals: detectIntentSignals("games that make you love gaming again"),
    });
    const classic = buildDiversityContext({
      userPrompt: "greatest games of all time",
      signals: detectIntentSignals("greatest games of all time"),
    });

    assert.ok(popularityWeightMultiplier(obscure) <= 0.12);
    assert.ok(popularityWeightMultiplier(fatigue) < 1);
    assert.ok(popularityWeightMultiplier(classic) > 1);
  });
});

describe("applyDiversityScoreAdjustments", () => {
  it("penalizes stacked canonical anchors under fatigue", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Games that make you love gaming again",
      signals: detectIntentSignals("Games that make you love gaming again"),
    });
    const scored = [
      { candidate: mockCandidate("Journey"), score: 50 },
      { candidate: mockCandidate("Celeste"), score: 49 },
      { candidate: mockCandidate("Firewatch"), score: 48 },
      { candidate: mockCandidate("NORCO"), score: 45 },
    ];
    const adjusted = applyDiversityScoreAdjustments(scored, ctx);
    const norco = adjusted.find((r) => r.candidate.name === "NORCO");
    const journey = adjusted.find((r) => r.candidate.name === "Journey");
    assert.ok(norco && journey);
    assert.ok(norco!.score >= journey!.score - 5);
  });

  it("demotes narrative indie canon for obscure hidden gem prompts", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Weird underrated hidden gems",
      signals: sig({ discoverySubkind: "underrated", memorableDiscovery: true }),
    });
    const scored = [
      {
        candidate: mockCandidate("Night in the Woods", {
          added: 70000,
          ratings_count: 35000,
        }),
        score: 46,
      },
      {
        candidate: mockCandidate("Oxenfree", { added: 65000, ratings_count: 30000 }),
        score: 45,
      },
      {
        candidate: mockCandidate("Citizen Sleeper", {
          added: 5000,
          ratings_count: 900,
        }),
        score: 42,
      },
    ];
    const adjusted = applyDiversityScoreAdjustments(scored, ctx);
    assert.ok(adjusted[0]!.candidate.name === "Citizen Sleeper");
  });

  it("demotes famous indie icons for obscure hidden gem prompts", () => {
    const ctx = buildDiversityContext({
      userPrompt: "weird underrated hidden gems",
      signals: sig({ discoverySubkind: "underrated", memorableDiscovery: true }),
    });
    const scored = [
      { candidate: mockCandidate("Undertale", { added: 90000, ratings_count: 50000 }), score: 44 },
      { candidate: mockCandidate("Signalis", { added: 8000, ratings_count: 1200 }), score: 42 },
    ];
    const adjusted = applyDiversityScoreAdjustments(scored, ctx);
    const undertale = adjusted.find((r) => r.candidate.name === "Undertale")!;
    const signalis = adjusted.find((r) => r.candidate.name === "Signalis")!;
    assert.ok(signalis.score > undertale.score);
    assert.ok(isFamousIndieForObscurePrompt("Undertale"));
  });

  it("does not over-penalize canonical titles for classic list prompts", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Best games ever made",
      signals: detectIntentSignals("Best games ever made"),
    });
    const scored = [
      { candidate: mockCandidate("Journey"), score: 50 },
      { candidate: mockCandidate("NORCO"), score: 48 },
    ];
    const adjusted = applyDiversityScoreAdjustments(scored, ctx);
    assert.ok(adjusted[0]!.candidate.name === "Journey");
  });
});

describe("balanceFinalPicksDiversity", () => {
  it("caps canonical anchors to two under fatigue", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Games that make you love gaming again",
      signals: detectIntentSignals("Games that make you love gaming again"),
    });
    const picks = [
      pick("Journey", 92),
      pick("Celeste", 91),
      pick("Firewatch", 90),
      pick("Gris", 89),
      pick("ABZU", 86, "good_alternative"),
      pick("Flower", 84, "good_alternative"),
    ];
    const balanced = balanceFinalPicksDiversity(picks, ctx);
    const canonicalCount = balanced.filter((p) => isCanonicalAnchorTitle(p.title)).length;
    assert.ok(canonicalCount <= 2, `expected <=2 canonical, got ${canonicalCount}`);
    assert.ok(balanced.length >= 4);
  });

  it("demotes famous indie icons for obscure hidden gem prompts", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Weird underrated hidden gems",
      signals: sig({ discoverySubkind: "underrated", memorableDiscovery: true }),
    });
    const picks = [
      pick("Hollow Knight", 88),
      pick("Undertale", 87),
      pick("Disco Elysium", 86),
      pick("Citizen Sleeper", 82, "good_alternative"),
      pick("Signalis", 80, "good_alternative"),
      pick("NORCO", 78, "good_alternative"),
    ];
    const balanced = balanceFinalPicksDiversity(picks, ctx);
    const famousInTop3 = balanced
      .slice(0, 3)
      .some((p) => isFamousIndieForObscurePrompt(p.title));
    assert.equal(famousInTop3, false);
  });

  it("allows at most one famous indie in obscure final picks", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Hidden gems under the radar, not Hollow Knight or Undertale",
      signals: detectIntentSignals(
        "Hidden gems under the radar, not Hollow Knight or Undertale"
      ),
    });
    const picks = [
      pick("Night in the Woods", 88),
      pick("Oxenfree", 87),
      pick("What Remains of Edith Finch", 86),
      pick("Gris", 85),
      pick("Citizen Sleeper", 82, "good_alternative"),
      pick("Signalis", 80, "good_alternative"),
      pick("NORCO", 78, "good_alternative"),
    ];
    const balanced = balanceFinalPicksDiversity(picks, ctx);
    const famousCount = balanced.filter((p) =>
      isFamousIndieForObscurePrompt(p.title)
    ).length;
    assert.ok(famousCount <= 1, `expected <=1 famous indie, got ${famousCount}`);
    const famousInTop3 = balanced
      .slice(0, 3)
      .some((p) => isFamousIndieForObscurePrompt(p.title));
    assert.equal(famousInTop3, false);
  });

  it("preserves journey-like picks when user asks for games like Journey", () => {
    const ctx = buildDiversityContext({
      userPrompt: "Games like Journey",
      signals: detectIntentSignals("Games like Journey"),
      referenceTitles: ["Journey"],
    });
    const picks = [
      pick("ABZU", 90),
      pick("Flower", 88),
      pick("Gris", 86),
      pick("Journey", 85),
    ];
    const balanced = balanceFinalPicksDiversity(picks, ctx);
    assert.ok(balanced.some((p) => p.title === "ABZU"));
    assert.ok(balanced.some((p) => p.title === "Flower"));
  });
});
