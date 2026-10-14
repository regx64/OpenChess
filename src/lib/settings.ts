"use client";

import { createPersistentStore } from "@/lib/storage";

export const BOARD_THEMES = {
  green: { label: "초록", light: "#ebecd0", dark: "#739552" },
  brown: { label: "나무", light: "#f0d9b5", dark: "#b58863" },
  blue: { label: "파랑", light: "#dee3e6", dark: "#8ca2ad" },
  gray: { label: "회색", light: "#e4e4e4", dark: "#9a9a9a" },
  purple: { label: "보라", light: "#efe6f5", dark: "#9a7fb5" },
} as const;

export type BoardThemeId = keyof typeof BOARD_THEMES;

export interface Settings {
  boardTheme: BoardThemeId;
  /** 보드 가장자리에 a–h, 1–8 표시 */
  showCoordinates: boolean;
  /** 기물을 고르면 갈 수 있는 칸 표시 */
  showLegalMoves: boolean;
  /** 직전 수 강조 */
  highlightLastMove: boolean;
  /** 기물 이동 애니메이션 시간 (ms, 0이면 끔) */
  animationMs: number;
  /** 효과음 */
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  boardTheme: "green",
  showCoordinates: true,
  showLegalMoves: true,
  highlightLastMove: true,
  animationMs: 180,
  sound: true,
};

export const settingsStore = createPersistentStore<Settings>(
  "settings",
  DEFAULT_SETTINGS,
);

export const useSettings = (): Settings => settingsStore.use();

export const updateSettings = (patch: Partial<Settings>): void =>
  settingsStore.set((previous) => ({ ...previous, ...patch }));
