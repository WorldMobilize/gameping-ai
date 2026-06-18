"use client";

import type { ComponentProps } from "react";
import GameDetailView from "@/components/game/GameDetailView";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";

type GameDetailWithThemeProps = Omit<ComponentProps<typeof GameDetailView>, "theme">;

export default function GameDetailWithTheme(props: GameDetailWithThemeProps) {
  const { theme } = useHomeTheme();
  return <GameDetailView {...props} theme={theme} />;
}
