import {
  buildGameStructuredDataGraph,
  type GameStructuredDataInput,
} from "@/lib/seo/game-structured-data";

type Props = {
  data: GameStructuredDataInput;
};

export default function GameStructuredData({ data }: Props) {
  const graph = buildGameStructuredDataGraph(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
