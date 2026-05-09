import OpenAI from "openai";
import { getCachedRawgGame, setCachedRawgGame } from "@/lib/cache";
import { lookupBestPrice, lookupDeals } from "@/lib/pricing/price-service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type RawgGame = {
  id: number;
  name: string;
  description_raw?: string;
  background_image?: string;
  rating?: number;
  metacritic?: number;
  released?: string;
  genres?: { name: string }[];
  platforms?: { platform: { name: string } }[];
  developers?: { name: string }[];
  publishers?: { name: string }[];
  esrb_rating?: { name: string };
};

type RawgScreenshot = {
  id: number;
  image: string;
};

type RawgMovie = {
  id: number;
  name: string;
  data?: {
    max?: string;
    "480"?: string;
  };
  preview?: string;
};

type GameAiDetails = {
  whyYouMayLikeIt: string;
  bestFor: string;
  pros: string[];
};

async function getRawgGame(title: string): Promise<RawgGame | null> {
  try {
    const slug = encodeURIComponent(title.trim().toLowerCase());
    const cached = await getCachedRawgGame<RawgGame>(slug);
    if (cached) return cached;

    const searchRes = await fetch(
      `https://api.rawg.io/api/games?key=${
        process.env.RAWG_API_KEY
      }&search=${encodeURIComponent(title)}&page_size=1`,
      { cache: "no-store" }
    );

    const searchData = await searchRes.json();
    const firstGame = searchData.results?.[0];

    if (!firstGame?.id) return null;

    const detailRes = await fetch(
      `https://api.rawg.io/api/games/${firstGame.id}?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    const payload = await detailRes.json();

    try {
      await setCachedRawgGame({
        slug,
        title,
        rawgPayload: payload,
      });
    } catch {}

    return payload;
  } catch {
    return null;
  }
}

async function getRawgScreenshots(gameId?: number): Promise<RawgScreenshot[]> {
  if (!gameId) return [];

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}/screenshots?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    return data.results?.slice(0, 8) || [];
  } catch {
    return [];
  }
}

async function getRawgMovies(gameId?: number): Promise<RawgMovie[]> {
  if (!gameId) return [];

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}/movies?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    return data.results?.slice(0, 2) || [];
  } catch {
    return [];
  }
}

async function getGameAiDetails(title: string): Promise<GameAiDetails> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Return ONLY valid JSON:

{
  "whyYouMayLikeIt": "Max 3 sentences.",
  "bestFor": "Short sentence.",
  "pros": ["short benefit 1", "short benefit 2", "short benefit 3"]
}

No markdown.
Do not invent prices.
`,
        },
        {
          role: "user",
          content: `Explain why someone may like the game: ${title}`,
        },
      ],
      temperature: 0.7,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");

    return {
      whyYouMayLikeIt:
        parsed.whyYouMayLikeIt ||
        "A strong pick if it matches your current gaming mood.",
      bestFor: parsed.bestFor || "Players looking for a great new game.",
      pros: Array.isArray(parsed.pros)
        ? parsed.pros.slice(0, 3)
        : ["Strong atmosphere", "Good value", "Worth checking out"],
    };
  } catch {
    return {
      whyYouMayLikeIt:
        "A strong pick if it matches your current gaming mood.",
      bestFor: "Players looking for a great new game.",
      pros: ["Strong atmosphere", "Good value", "Worth checking out"],
    };
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/10 py-4">
      <span className="text-sm text-white/45">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-bold text-white/85">
        {value || "N/A"}
      </span>
    </div>
  );
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = decodeURIComponent(slug);

  const rawg = await getRawgGame(title);
  const screenshots = await getRawgScreenshots(rawg?.id);
  const movies = await getRawgMovies(rawg?.id);
  const bestPrice = await lookupBestPrice({ title });
  const deals = await lookupDeals({ title, limit: 5 });
  const ai = await getGameAiDetails(title);

  const heroImage = rawg?.background_image || screenshots[0]?.image;
  const trailer = movies[0]?.data?.max || movies[0]?.data?.["480"];
  const trailerPoster = movies[0]?.preview || heroImage;
  const description =
    rawg?.description_raw ||
    "No official description available for this game yet.";

  const genres = rawg?.genres?.map((g) => g.name).join(", ");
  const platforms = rawg?.platforms
    ?.slice(0, 8)
    .map((p) => p.platform.name)
    .join(", ");
  const developers = rawg?.developers?.map((d) => d.name).join(", ");
  const publishers = rawg?.publishers?.map((p) => p.name).join(", ");

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <section className="relative overflow-hidden pb-10">
        {heroImage && (
          <img
            src={heroImage}
            alt={rawg?.name || title}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-sm"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#03040a]/80 to-[#03040a]" />
        <div className="absolute left-10 top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          <a
            href="/recommend"
            className="w-fit rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70 backdrop-blur transition hover:border-cyan-400/50 hover:text-cyan-300"
          >
            ← Back to recommendations
          </a>

          <div className="grid gap-10 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-5 text-sm uppercase tracking-[0.45em] text-cyan-300">
                GamePing pick
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
                {rawg?.name || title}
              </h1>

              <p className="mt-6 max-w-2xl text-xl leading-9 text-white/75">
                {description.slice(0, 460)}
                {description.length > 460 ? "..." : ""}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {rawg?.genres?.slice(0, 6).map((genre) => (
                  <span
                    key={genre.name}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 backdrop-blur"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                {bestPrice?.deal?.url ? (
                  <a
                    href={bestPrice.deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-cyan-400 px-8 py-4 text-base font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                  >
                    Buy now for ${bestPrice.price} →
                  </a>
                ) : (
                  <span className="rounded-full bg-white/10 px-8 py-4 font-bold text-white/50">
                    No deal available
                  </span>
                )}
                {bestPrice?.deal?.url && (
                  <p className="w-full text-xs text-white/45">
                    Redirects via CheapShark to the store.
                  </p>
                )}

                {trailer && (
                  <a
                    href="#trailer"
                    className="rounded-full border border-white/15 bg-white/5 px-8 py-4 font-bold text-white/80 backdrop-blur transition hover:border-purple-400/60 hover:text-purple-200"
                  >
                    ▶ Watch trailer
                  </a>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 to-purple-600/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={rawg?.name || title}
                    className="h-[450px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[450px] items-center justify-center bg-black/40 text-white/40">
                    No image available
                  </div>
                )}

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-widest text-white/40">
                        Price
                      </p>
                      <p className="mt-2 text-2xl font-black text-cyan-300">
                        {bestPrice?.price ? `$${bestPrice.price}` : "Price unavailable"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-widest text-white/40">
                        Rating
                      </p>
                      <p className="mt-2 text-2xl font-black text-yellow-300">
                        {rawg?.rating ? `${rawg.rating}/5` : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-widest text-white/40">
                        Metacritic
                      </p>
                      <p className="mt-2 text-2xl font-black text-green-300">
                        {rawg?.metacritic || "N/A"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-white/60">
                    {ai.bestFor}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Rating
            </p>
            <p className="mt-3 text-3xl font-black text-yellow-300">
              {rawg?.rating ? `${rawg.rating}/5` : "N/A"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Release
            </p>
            <p className="mt-3 text-2xl font-black text-white">
              {rawg?.released || "N/A"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Genres
            </p>
            <p className="mt-3 text-lg font-bold text-cyan-300">
              {genres || "N/A"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              Best for
            </p>
            <p className="mt-3 text-sm leading-6 text-white/75">
              {ai.bestFor}
            </p>
          </div>
        </div>
      </section>

      {trailer && (
        <section id="trailer" className="mx-auto max-w-7xl px-6 pb-14">
          <p className="text-sm uppercase tracking-[0.35em] text-purple-300">
            Official media
          </p>
          <h2 className="mt-3 text-4xl font-black">Trailer</h2>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
            <video
              src={trailer}
              controls
              poster={trailerPoster}
              className="aspect-video w-full bg-black object-cover"
            />
          </div>
        </section>
      )}

      {screenshots.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            Gallery
          </p>
          <h2 className="mt-3 text-4xl font-black">Screenshots</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {screenshots.map((shot, index) => (
              <a
                key={shot.id}
                href={shot.image}
                target="_blank"
                rel="noopener noreferrer"
                className={`group overflow-hidden rounded-3xl border border-white/10 ${
                  index === 0 ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <img
                  src={shot.image}
                  alt={`${title} screenshot ${index + 1}`}
                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Overview
            </p>
            <h2 className="mt-4 text-3xl font-black">About this game</h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/70">
              {description}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-purple-300">
              Personal fit
            </p>
            <h2 className="mt-4 text-3xl font-black">Why you may like it</h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              {ai.whyYouMayLikeIt}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {ai.pros.map((pro) => (
                <div
                  key={pro}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <p className="text-sm font-bold text-cyan-300">✓ {pro}</p>
                </div>
              ))}
            </div>
          </div>

          {deals.length > 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
                Store comparison
              </p>
              <h2 className="mt-4 text-3xl font-black">Best current deals</h2>

              <div className="mt-6 space-y-3">
                {deals.map((deal) => (
                  <div
                    key={deal.deal.id}
                    className="grid items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="font-black">{deal.store.name || "Store"}</p>
                      <p className="text-sm text-white/45">
                        Normal price: ${deal.normalPrice}
                      </p>
                    </div>

                    <p className="text-2xl font-black text-cyan-300">
                      ${deal.salePrice}
                    </p>

                    <a
                      href={deal.deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black transition hover:bg-cyan-100"
                    >
                      Buy →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Game info
            </p>

            <div className="mt-5">
              <DetailRow label="Release date" value={rawg?.released} />
              <DetailRow label="Genres" value={genres} />
              <DetailRow label="Platforms" value={platforms} />
              <DetailRow label="Developer" value={developers} />
              <DetailRow label="Publisher" value={publishers} />
              <DetailRow label="ESRB" value={rawg?.esrb_rating?.name} />
              <DetailRow
                label="RAWG rating"
                value={rawg?.rating ? `${rawg.rating}/5` : null}
              />
              <DetailRow label="Metacritic" value={rawg?.metacritic} />
            </div>
          </div>

          <div className="sticky top-6 rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">
              Deal summary
            </p>
            <h2 className="mt-4 text-4xl font-black">
              {bestPrice?.price ? `$${bestPrice.price}` : "Price unavailable"}
            </h2>
            <p className="mt-4 text-white/65">
              {bestPrice
                ? bestPrice.store?.name
                  ? `Current lowest known price found via ${bestPrice.provider} (${bestPrice.store.name}).`
                  : `Current lowest known price found via ${bestPrice.provider}.`
                : "Price may be unavailable or rate-limited right now. Check again later."}
            </p>

            {bestPrice?.deal?.url && (
              <a
                href={bestPrice.deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-full bg-white px-6 py-4 text-center font-black text-black transition hover:bg-cyan-100"
              >
                Get the deal →
              </a>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}