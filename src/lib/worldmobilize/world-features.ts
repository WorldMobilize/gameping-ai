/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-worldmobilize-map.mjs
 *
 * Terrain feature layer data for the WorldMobilize map (seed "worldmobilize-v1"):
 * scattered glyph positions (mountains/forests/dunes), smooth flow paths
 * (rivers/lakes/roads), and one settlement anchor per region. Decorative
 * only — the interactive layer stays the region polygons.
 */

export type MapFeaturePoint = {
  x: number;
  y: number;
  /** Glyph size in world units. */
  s: number;
  /** Owning macro-area id (for per-biome tinting). */
  macro: string;
};

export type MapSettlement = {
  x: number;
  y: number;
  /** True for the macro-area's principal settlement (bigger glyph). */
  major: boolean;
};

export const MOUNTAINS: MapFeaturePoint[] = [
  { x: 226.5, y: 102.8, s: 14.3, macro: "palegrave" },
  { x: 264.3, y: 85.4, s: 15.1, macro: "palegrave" },
  { x: 244.7, y: 75, s: 12.6, macro: "palegrave" },
  { x: 355, y: 67.3, s: 14.1, macro: "palegrave" },
  { x: 326.8, y: 79.7, s: 13.7, macro: "palegrave" },
  { x: 319.4, y: 105.2, s: 16.4, macro: "palegrave" },
  { x: 404.3, y: 104.3, s: 12.6, macro: "palegrave" },
  { x: 434.2, y: 103.1, s: 12.8, macro: "palegrave" },
  { x: 395.7, y: 68, s: 12, macro: "palegrave" },
  { x: 246.7, y: 169.8, s: 13.9, macro: "palegrave" },
  { x: 230.1, y: 146.4, s: 14.8, macro: "palegrave" },
  { x: 263, y: 150.9, s: 12.4, macro: "palegrave" },
  { x: 332.9, y: 183.8, s: 13.6, macro: "palegrave" },
  { x: 336.8, y: 138.6, s: 14.8, macro: "palegrave" },
  { x: 349.7, y: 183.6, s: 13.6, macro: "palegrave" },
  { x: 729.9, y: 58.4, s: 7.3, macro: "thunder-steppe" },
  { x: 844, y: 60.7, s: 9.4, macro: "thunder-steppe" },
  { x: 734.9, y: 146.9, s: 9.7, macro: "thunder-steppe" },
  { x: 812.7, y: 177.5, s: 8.3, macro: "thunder-steppe" },
  { x: 916, y: 179.8, s: 10.6, macro: "thunder-steppe" },
  { x: 830, y: 253.4, s: 10.7, macro: "thunder-steppe" },
  { x: 109.8, y: 229.8, s: 8.8, macro: "lumen-coast" },
  { x: 164.7, y: 224.3, s: 7.2, macro: "lumen-coast" },
  { x: 74.6, y: 332.8, s: 6.9, macro: "lumen-coast" },
  { x: 145.8, y: 327.2, s: 6.3, macro: "lumen-coast" },
  { x: 75, y: 427.1, s: 7.1, macro: "lumen-coast" },
  { x: 411.7, y: 226.8, s: 6.4, macro: "hollowmark" },
  { x: 391.4, y: 337.2, s: 7.1, macro: "hollowmark" },
  { x: 521, y: 321, s: 7.6, macro: "hollowmark" },
  { x: 432.2, y: 409.8, s: 6.1, macro: "hollowmark" },
  { x: 510, y: 393.6, s: 9.4, macro: "hollowmark" },
  { x: 589.3, y: 507.7, s: 17.2, macro: "cinderveil" },
  { x: 572.5, y: 491.7, s: 17.6, macro: "cinderveil" },
  { x: 637.9, y: 482.2, s: 15.5, macro: "cinderveil" },
  { x: 637.5, y: 483.3, s: 18.5, macro: "cinderveil" },
  { x: 557.1, y: 594.8, s: 14.9, macro: "cinderveil" },
  { x: 557, y: 578.1, s: 14.4, macro: "cinderveil" },
  { x: 652.8, y: 590.9, s: 13.1, macro: "cinderveil" },
  { x: 685.1, y: 589.9, s: 12.2, macro: "cinderveil" },
  { x: 894.8, y: 554.7, s: 6, macro: "shardpelago" },
  { x: 1079.9, y: 471.7, s: 6.1, macro: "shardpelago" },
  { x: 1013.2, y: 652.5, s: 7, macro: "shardpelago" },
  { x: 1135.6, y: 566.4, s: 7.5, macro: "shardpelago" },
  { x: 499.5, y: 338.1, s: 11.9, macro: "hollowmark" },
  { x: 478.1, y: 358.2, s: 9.6, macro: "hollowmark" },
  { x: 443.2, y: 360.7, s: 8.8, macro: "hollowmark" },
  { x: 430.6, y: 351.2, s: 8.3, macro: "hollowmark" },
  { x: 403.7, y: 330.9, s: 9.9, macro: "hollowmark" },
  { x: 409, y: 315.8, s: 9.8, macro: "hollowmark" },
  { x: 445.8, y: 302.7, s: 10.9, macro: "hollowmark" },
  { x: 471.2, y: 308, s: 8.4, macro: "hollowmark" },
  { x: 487, y: 317.1, s: 11.4, macro: "hollowmark" },
];

export const FORESTS: MapFeaturePoint[] = [
  { x: 242.7, y: 83.4, s: 5.8, macro: "palegrave" },
  { x: 234.6, y: 89, s: 5.8, macro: "palegrave" },
  { x: 356.1, y: 96.8, s: 6.2, macro: "palegrave" },
  { x: 323.9, y: 87.6, s: 6.8, macro: "palegrave" },
  { x: 432, y: 96.7, s: 6.6, macro: "palegrave" },
  { x: 432.9, y: 81.2, s: 6.1, macro: "palegrave" },
  { x: 231.2, y: 152.1, s: 6.1, macro: "palegrave" },
  { x: 234.3, y: 148, s: 6.3, macro: "palegrave" },
  { x: 321.5, y: 167.8, s: 6.8, macro: "palegrave" },
  { x: 326.4, y: 169.5, s: 5.9, macro: "palegrave" },
  { x: 740.3, y: 89.3, s: 5.2, macro: "thunder-steppe" },
  { x: 831.9, y: 67.1, s: 5.2, macro: "thunder-steppe" },
  { x: 754.9, y: 185, s: 5.3, macro: "thunder-steppe" },
  { x: 848.6, y: 151, s: 4.5, macro: "thunder-steppe" },
  { x: 889.6, y: 175.8, s: 4.4, macro: "thunder-steppe" },
  { x: 834.1, y: 247.7, s: 5.6, macro: "thunder-steppe" },
  { x: 105, y: 240.5, s: 6, macro: "lumen-coast" },
  { x: 173.5, y: 266.5, s: 5.7, macro: "lumen-coast" },
  { x: 110.2, y: 328.3, s: 5.2, macro: "lumen-coast" },
  { x: 185.5, y: 336.2, s: 5.4, macro: "lumen-coast" },
  { x: 75.2, y: 428.3, s: 6.1, macro: "lumen-coast" },
  { x: 601.8, y: 497.2, s: 4.5, macro: "cinderveil" },
  { x: 638.4, y: 491.3, s: 4.2, macro: "cinderveil" },
  { x: 562, y: 558.4, s: 5.9, macro: "cinderveil" },
  { x: 642.3, y: 580.1, s: 4.6, macro: "cinderveil" },
  { x: 178.2, y: 501.6, s: 8.3, macro: "verdant-hollow" },
  { x: 170.8, y: 481.5, s: 8.6, macro: "verdant-hollow" },
  { x: 155.6, y: 506.8, s: 6, macro: "verdant-hollow" },
  { x: 144.4, y: 492, s: 8, macro: "verdant-hollow" },
  { x: 262, y: 513.7, s: 5.7, macro: "verdant-hollow" },
  { x: 259.3, y: 493.3, s: 7.2, macro: "verdant-hollow" },
  { x: 248.6, y: 473.2, s: 7.9, macro: "verdant-hollow" },
  { x: 261.6, y: 509.1, s: 7, macro: "verdant-hollow" },
  { x: 164.6, y: 563.2, s: 7.6, macro: "verdant-hollow" },
  { x: 165.4, y: 577.5, s: 5.2, macro: "verdant-hollow" },
  { x: 158.7, y: 585.6, s: 5.2, macro: "verdant-hollow" },
  { x: 158.9, y: 585.2, s: 6.5, macro: "verdant-hollow" },
  { x: 274.8, y: 575.5, s: 5.8, macro: "verdant-hollow" },
  { x: 249.8, y: 581.1, s: 7.5, macro: "verdant-hollow" },
  { x: 232.8, y: 565.4, s: 8.3, macro: "verdant-hollow" },
  { x: 256.1, y: 587, s: 7.6, macro: "verdant-hollow" },
  { x: 892.8, y: 562.9, s: 4.2, macro: "shardpelago" },
  { x: 1075.7, y: 513.9, s: 4.2, macro: "shardpelago" },
  { x: 965.2, y: 633, s: 4.2, macro: "shardpelago" },
  { x: 1154.5, y: 553.5, s: 4.6, macro: "shardpelago" },
];

export const DUNES: MapFeaturePoint[] = [
  { x: 911.5, y: 225.5, s: 10.6, macro: "vitrine-expanse" },
  { x: 884.3, y: 221.6, s: 8.9, macro: "vitrine-expanse" },
  { x: 972.6, y: 265, s: 11.4, macro: "vitrine-expanse" },
  { x: 976.5, y: 221.3, s: 8.5, macro: "vitrine-expanse" },
  { x: 891.9, y: 325.2, s: 12.3, macro: "vitrine-expanse" },
  { x: 920.7, y: 319.8, s: 11.5, macro: "vitrine-expanse" },
  { x: 976.9, y: 319.9, s: 9.8, macro: "vitrine-expanse" },
  { x: 967.7, y: 328.8, s: 8.1, macro: "vitrine-expanse" },
  { x: 1077.1, y: 337.5, s: 8.8, macro: "vitrine-expanse" },
  { x: 1054, y: 306.2, s: 11.2, macro: "vitrine-expanse" },
  { x: 974.1, y: 386.7, s: 10.6, macro: "vitrine-expanse" },
  { x: 968.5, y: 386.3, s: 10.9, macro: "vitrine-expanse" },
];

/** Smooth open paths (SVG d) in world coordinates. */
export const RIVERS: string[] = [
  "M334.9 65.8C329.2 76.7 312.7 111.3 301.2 131.7C289.7 152.1 278.3 167.8 266 188.3C253.6 208.8 233.4 243.8 226.9 254.9",
  "M743.5 89.8C751.9 97 777 118.9 793.9 132.7C810.8 146.4 823.7 170.3 845 172.3C866.4 174.2 901.5 155.8 922.1 144.6C942.7 133.4 960.8 111.8 968.6 105.3",
  "M184.2 468.2C188.6 478.5 199.2 511.7 210.6 529.9C221.9 548.2 239.1 558.5 252.4 577.4C265.8 596.3 284.3 632.4 290.7 643.4",
  "M480.6 421.8C488 431.5 509.4 461.6 525.2 480.1C541 498.5 561.4 505.7 575.6 532.6C589.7 559.4 604.1 623.1 609.8 641.2",
];

/** Smooth closed paths (SVG d) in world coordinates. */
export const LAKES: string[] = [
  "M468.8 330.7C469.2 334.2 472 341.4 469.2 345C466.4 348.7 457 352.9 451.9 352.6C446.9 352.2 442.6 346.3 439.1 343.1C435.7 339.9 431.8 337.4 431.4 333.3C430.9 329.2 432.9 321.2 436.4 318.4C439.8 315.6 447 315.5 452.1 316.5C457.2 317.4 464.2 321.8 467 324.1C469.8 326.5 468.4 327.2 468.8 330.7Z",
  "M220.6 521.5C220.4 524.8 218.7 526.9 215.8 528.5C212.9 530.1 207.2 531.3 203.4 530.9C199.6 530.5 195.3 528.7 193.2 526.2C191.1 523.7 189.9 519 190.9 516C191.9 513 195.1 509.4 199.4 508.3C203.7 507.1 213.3 506.8 216.9 509C220.4 511.2 220.8 518.3 220.6 521.5Z",
  "M814.8 165C813.9 168 809.1 170.6 806.1 172.9C803.1 175.3 799.7 179.5 796.8 179.1C793.9 178.7 789.9 173.6 788.4 170.6C786.9 167.7 786.3 163.4 788 161.5C789.6 159.6 794.6 160.1 798.6 159C802.5 158 809.1 154 811.8 155C814.5 156 815.8 162 814.8 165Z",
];

/** Dashed trade-road paths along settlement chains. */
export const ROADS: string[] = [
  "M96.6 237.6C109.7 241.6 178.5 243.8 175.5 262C172.4 280.1 77.3 332.5 78.3 346.6C79.3 360.7 177 332.5 181.6 346.7C186.2 360.9 118.5 417.6 105.9 431.8",
  "M255.8 89.5C272.1 85.7 326.2 66 353.8 66.4C381.3 66.8 439.6 72.7 421.2 91.9C402.7 111.1 257.4 166.1 243 181.5C228.7 196.9 319.6 183.9 334.9 184.4",
  "M738.8 83.2C753.8 83.4 829.4 68.6 829 84.1C828.5 99.6 739.8 160.3 736.3 176.4C732.8 192.5 795.4 168.1 807.9 180.7C820.4 193.3 810.6 239.9 811.2 251.8",
  "M813.4 181.7C830.9 180.4 902.8 159.9 918.4 173.5C934.1 187.1 909 248.4 907.1 263.4",
  "M908.8 263.5C920.8 262.7 980.6 244 980.3 258.8C979.9 273.6 905.9 336 906.7 352.3C907.6 368.6 969.5 345.1 985.5 356.8C1001.6 368.5 1000.3 411.3 1003.2 422.2",
  "M419.7 235.6C414.3 252.5 375 319.2 387.1 336.6C399.1 353.9 471.2 325.6 491.9 339.8C512.6 354 508.1 408.2 511.3 421.9",
  "M584.5 499.3C596.4 496.4 660.3 467.3 655.6 481.4C650.8 495.5 555.3 567 556.1 584.2C557 601.5 643.1 584.8 660.5 584.9",
  "M156.4 486.4C171.7 484.1 246.3 456 248.3 472.9C250.2 489.8 168.2 569.2 168.1 587.8C168 606.4 234.3 585 247.5 584.5",
];

/** One settlement per region id. */
export const SETTLEMENTS: Record<string, MapSettlement> = {
  "rimehold": { x: 252.8, y: 87.8, major: true },
  "aurora-shelf": { x: 349.4, y: 66.7, major: false },
  "whiteout-pass": { x: 423.8, y: 96.9, major: false },
  "glacier-maw": { x: 241.8, y: 182.4, major: false },
  "snowline": { x: 337.6, y: 183, major: false },
  "galehowl": { x: 742.6, y: 88.1, major: true },
  "static-flats": { x: 832.2, y: 83.7, major: false },
  "thunderfall": { x: 739.6, y: 179.5, major: false },
  "ion-prairie": { x: 812.7, y: 178, major: false },
  "cloudsplit": { x: 915, y: 169.2, major: false },
  "roaring-verge": { x: 814.9, y: 251.1, major: false },
  "glowharbor": { x: 96.3, y: 235.6, major: true },
  "signal-bluffs": { x: 178.9, y: 258, major: false },
  "chromatide": { x: 78.9, y: 344.1, major: false },
  "neonfen": { x: 185.7, y: 346.4, major: false },
  "cablereach": { x: 106.1, y: 433.7, major: false },
  "nullfield": { x: 418.1, y: 234.6, major: true },
  "ashen-grid": { x: 392, y: 339.4, major: false },
  "the-silence": { x: 495.4, y: 340.3, major: false },
  "craterline": { x: 401.8, y: 421.1, major: false },
  "ghoststead": { x: 512.7, y: 417.5, major: false },
  "shimmerdune": { x: 905.7, y: 258.8, major: true },
  "fusewind": { x: 978.6, y: 259.6, major: false },
  "glasswake": { x: 903.2, y: 353.9, major: false },
  "sunscar": { x: 989.3, y: 352.9, major: false },
  "duskpane": { x: 1066.4, y: 329, major: false },
  "silica-reach": { x: 1002.7, y: 422.5, major: false },
  "soot-hollow": { x: 581.7, y: 503.5, major: true },
  "pyre-steps": { x: 658.1, y: 486.3, major: false },
  "emberline": { x: 561, y: 588.3, major: false },
  "charwood": { x: 663, y: 588.6, major: false },
  "mossreach": { x: 155.6, y: 489.8, major: true },
  "canopy-deep": { x: 252.8, y: 476, major: false },
  "vinegate": { x: 168.8, y: 582.9, major: false },
  "bloomfen": { x: 244.7, y: 584.2, major: false },
  "brineshard": { x: 907.4, y: 592.3, major: true },
  "coral-break": { x: 1063.6, y: 505.1, major: false },
  "mistling-isle": { x: 994.6, y: 684.1, major: false },
  "tidevault": { x: 1136.2, y: 573.6, major: false },
};
