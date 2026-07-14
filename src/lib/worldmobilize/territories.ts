/**
 * WorldMobilize — demo territory data (Claim MVP).
 *
 * 20 game-community territories on a stylized board. No official logos or
 * copyrighted art — each territory uses an emoji glyph + an accent color.
 * This is static demo data; the board is an abstract "alternate gaming world",
 * not real-world geography.
 */

export type Territory = {
  id: string;
  name: string;
  /** The game/community category. */
  category: string;
  /** Stylized glyph (emoji) — no logos. */
  glyph: string;
  /** Accent color (hex) used when the territory is claimed. */
  accent: string;
};

export const TERRITORIES: Territory[] = [
  { id: "minecraft", name: "Blockhaven", category: "Minecraft", glyph: "⛏️", accent: "#22c55e" },
  { id: "lol", name: "Rift Dominion", category: "League of Legends", glyph: "⚔️", accent: "#38bdf8" },
  { id: "cs", name: "Dust Reach", category: "Counter-Strike", glyph: "🎯", accent: "#f59e0b" },
  { id: "valorant", name: "Radiant Front", category: "Valorant", glyph: "🔺", accent: "#f43f5e" },
  { id: "elden-ring", name: "Erdtree Vale", category: "Elden Ring", glyph: "💍", accent: "#eab308" },
  { id: "fortnite", name: "Storm Isles", category: "Fortnite", glyph: "🛖", accent: "#a855f7" },
  { id: "stardew", name: "Pelican Fields", category: "Stardew Valley", glyph: "🌾", accent: "#84cc16" },
  { id: "terraria", name: "Corruption Wilds", category: "Terraria", glyph: "🌳", accent: "#10b981" },
  { id: "7dtd", name: "Navezgane Ruins", category: "7 Days to Die", glyph: "🧟", accent: "#ef4444" },
  { id: "rust", name: "Scrap Coast", category: "Rust", glyph: "🔧", accent: "#f97316" },
  { id: "warframe", name: "Origin Expanse", category: "Warframe", glyph: "🥷", accent: "#06b6d4" },
  { id: "helldivers", name: "Super Frontier", category: "Helldivers", glyph: "🪖", accent: "#facc15" },
  { id: "dota", name: "Ancient Basin", category: "Dota 2", glyph: "🛡️", accent: "#dc2626" },
  { id: "wow", name: "Azeroth March", category: "World of Warcraft", glyph: "🐉", accent: "#3b82f6" },
  { id: "bg3", name: "Faerûn Reach", category: "Baldur's Gate 3", glyph: "🎲", accent: "#b45309" },
  { id: "cyberpunk", name: "Night City Sprawl", category: "Cyberpunk 2077", glyph: "🌆", accent: "#ec4899" },
  { id: "gta", name: "Los Santos Bay", category: "GTA", glyph: "🚗", accent: "#14b8a6" },
  { id: "sims", name: "Willow Suburb", category: "The Sims", glyph: "🏡", accent: "#22d3ee" },
  { id: "monster-hunter", name: "Wyvern Steppe", category: "Monster Hunter", glyph: "🐲", accent: "#7c3aed" },
  { id: "hollow-knight", name: "Hallownest Deep", category: "Hollow Knight", glyph: "🐛", accent: "#6366f1" },
];

export const TERRITORY_BY_ID: Record<string, Territory> = Object.fromEntries(
  TERRITORIES.map((t) => [t.id, t])
);
