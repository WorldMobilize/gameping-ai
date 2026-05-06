export type CheapSharkGame = {
  gameID: string;
  steamAppID?: string;
  cheapest: string;
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
};

export async function getCheapSharkPrice(title: string) {
  const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
    title
  )}&limit=5`;

  const res = await fetch(url);

  if (!res.ok) {
    return null;
  }

  const games: CheapSharkGame[] = await res.json();

  if (!games || games.length === 0) {
    return null;
  }

  const bestMatch = games[0];

  return {
    title: bestMatch.external,
    price: Number(bestMatch.cheapest),
    dealId: bestMatch.cheapestDealID,
    thumb: bestMatch.thumb,
  };
}