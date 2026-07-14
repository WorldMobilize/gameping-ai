import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.akamai.steamstatic.com",
        pathname: "/steam/apps/**",
      },
      {
        protocol: "https",
        hostname: "media.rawg.io",
        pathname: "/media/**",
      },
    ],
  },
  async redirects() {
    // The collection routes were renamed to say what they are: /curated held
    // both families under a name that fit neither, and /browse was really the
    // curated collections. Old URLs redirect permanently so nothing 404s.
    //
    // Order matters: the games-like rule must be matched before the catch-all,
    // or every collection would land on /collections.
    return [
      {
        source: "/curated/games-like-:slug",
        destination: "/games-like/:slug",
        permanent: true,
      },
      { source: "/curated/:slug", destination: "/collections/:slug", permanent: true },
      { source: "/curated", destination: "/games-like", permanent: true },
      { source: "/browse", destination: "/collections", permanent: true },
    ];
  },
};

export default nextConfig;
