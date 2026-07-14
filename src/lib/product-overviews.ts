/** Data for the product overview ("Read more") pages — future SEO hubs. */

export type ProductOverview = {
  slug: string;
  status: string;
  name: string;
  tagline: string;
  intro: string;
  primary: { label: string; href: string };
  overviewTitle: string;
  overview: string;
  features: { title: string; desc: string }[];
  roadmap: { phase: string; items: string[] }[];
  faqs: { q: string; a: string }[];
};

export const PRODUCT_OVERVIEWS: Record<string, ProductOverview> = {
  worldmobilize: {
    slug: "worldmobilize",
    status: "Early Access",
    name: "WorldMobilize",
    tagline: "A living map where gaming communities claim territory and make history together.",
    intro:
      "WorldMobilize turns fandom into presence. Communities claim sectors of an original world, show their identity, and — soon — fight to hold them.",
    primary: { label: "Explore WorldMobilize", href: "/worldmobilize" },
    overviewTitle: "A shared world that remembers what players do",
    overview:
      "Every game has a community, but nowhere to stand. WorldMobilize gives them ground. The map is an original, alternate world split into balanced sectors. A community claims one, plants its flag with links and identity, and holds it. Creators can rally their audience behind a faction, and live campaigns move momentum across the board. It's a place to represent your game, defend your community, and make history.",
    features: [
      { title: "Territories", desc: "Claim and hold sectors across an original world — no real-world geography." },
      { title: "Community identity", desc: "Fly your colors with a name, links, and a home on the map." },
      { title: "Creator factions", desc: "Rally an audience behind a faction and mobilize together." },
      { title: "Future battles", desc: "Live campaigns and wars that shift the map — coming later." },
      { title: "A living board", desc: "The map reacts to real activity, not a static illustration." },
      { title: "Seasons", desc: "Founding seasons, momentum, and bragging rights over time." },
    ],
    roadmap: [
      { phase: "Now", items: ["Claim a territory", "Add your community links", "See ownership on the map"] },
      { phase: "Next", items: ["Community profiles", "Creator factions", "Momentum & activity"] },
      { phase: "Later", items: ["Live battles", "Seasons & leaderboards", "Events & rewards"] },
    ],
    faqs: [
      { q: "Is WorldMobilize live?", a: "The claim demo is live in Early Access — you can claim a territory now. Battles and seasons are on the roadmap." },
      { q: "Do I need to pay to claim?", a: "Not during the demo. Pricing for territories will be introduced later; nothing is charged today." },
      { q: "Is this a real-world map?", a: "No — it's an original, alternate gaming world with invented sectors. No real countries or borders." },
    ],
  },
  companion: {
    slug: "companion",
    status: "Alpha",
    name: "Desktop Companion",
    tagline: "Your gaming assistant, right beside your game — no alt-tab required.",
    intro:
      "Companion is a premium desktop app that answers questions, shows maps, and helps you play — in a clean overlay on top of your game.",
    primary: { label: "Get Companion", href: "/companion/about" },
    overviewTitle: "Help that comes to you, mid-game",
    overview:
      "You shouldn't have to leave your game to look something up. Companion sits on top of it as a calm overlay: ask a question by text or voice, pull up a map, get a spoiler-light hint, or check a build — and get back to playing. It understands the game you're in, so answers are contextual instead of generic. It's the wiki, the map, and the coach, without the alt-tab.",
    features: [
      { title: "In-game overlay", desc: "A clean panel on top of your game — always a keystroke away." },
      { title: "Voice assistant", desc: "Ask out loud, hands on the controls." },
      { title: "Maps", desc: "Pull up interactive maps without switching windows." },
      { title: "Walkthroughs", desc: "Spoiler-light, step-by-step help on demand." },
      { title: "Build help", desc: "Loadouts, gear, and strategies in seconds." },
      { title: "Contextual help", desc: "Answers tuned to the exact game you're playing." },
    ],
    roadmap: [
      { phase: "Now", items: ["Ask & answer (alpha)", "Contextual game help", "Overlay foundation"] },
      { phase: "Next", items: ["Voice input", "Maps & walkthroughs", "Build assistant"] },
      { phase: "Later", items: ["Live game state", "Cross-device sync", "Community guides"] },
    ],
    faqs: [
      { q: "Which platforms are supported?", a: "Companion targets desktop first. It's in a limited alpha while we harden the overlay and assistant." },
      { q: "Can it see my screen?", a: "No — it can't see your live screen or game state today. It answers generally and asks you to describe what you see when it matters." },
      { q: "How do I get it?", a: "Companion is admin-only during the alpha. Create an account to be first in line as access opens up." },
    ],
  },
};

export function getProductOverview(slug: string): ProductOverview | undefined {
  return PRODUCT_OVERVIEWS[slug];
}
