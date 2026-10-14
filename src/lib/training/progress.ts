"use client";

import { createPersistentStore } from "@/lib/storage";
import { type CardState, type Grade, newCard, review, today } from "./srs";

/**
 * 학습 기록. DB가 없으므로 모두 브라우저(localStorage)에 저장합니다.
 * 정복 대시보드(5단계)와 백업 기능이 이 저장소들을 읽습니다.
 */

/** 오프닝 수순 카드 (키: "w|오프닝 이름" — 백으로 연습하는 그 오프닝) */
export const cardsStore = createPersistentStore<Record<string, CardState>>(
  "cards",
  {},
);

export const cardKey = (color: "w" | "b", name: string) => `${color}|${name}`;

export function recordReview(color: "w" | "b", name: string, grade: Grade) {
  const key = cardKey(color, name);
  cardsStore.set((cards) => ({
    ...cards,
    [key]: review(cards[key] ?? newCard(), grade),
  }));
  recordActivity("drills");
}

export type ActivityKind = "drills" | "quiz" | "puzzles" | "traps" | "games";

/** 날짜(일 번호)별 활동 수 — 연속 학습일 계산용 */
export const activityStore = createPersistentStore<
  Record<string, Partial<Record<ActivityKind, number>>>
>("activity", {});

export function recordActivity(kind: ActivityKind, count = 1) {
  const day = String(today());
  activityStore.set((activity) => ({
    ...activity,
    [day]: { ...activity[day], [kind]: (activity[day]?.[kind] ?? 0) + count },
  }));
}

/** 오늘까지 이어진 연속 학습일 (오늘 아직 안 했으면 어제까지) */
export function currentStreak(
  activity: Record<string, Partial<Record<ActivityKind, number>>>,
  day: number = today(),
): number {
  const active = (d: number) =>
    Object.values(activity[String(d)] ?? {}).some((count) => (count ?? 0) > 0);
  let start = active(day) ? day : day - 1;
  let streak = 0;
  while (active(start)) {
    streak++;
    start--;
  }
  return streak;
}

/** 오프닝 페이지를 열어 본 기록 (이름 → 처음 본 날) */
export const viewedStore = createPersistentStore<Record<string, number>>(
  "viewed",
  {},
);

export function recordViewed(name: string) {
  if (viewedStore.get()[name] !== undefined) return;
  viewedStore.set((viewed) => ({ ...viewed, [name]: today() }));
}

export interface QuizStats {
  correct: number;
  total: number;
  bestStreak: number;
  /** 맞힌 오프닝 이름 */
  solved: string[];
}

export const quizStore = createPersistentStore<QuizStats>("quiz", {
  correct: 0,
  total: 0,
  bestStreak: 0,
  solved: [],
});

export interface PuzzleStats {
  rating: number;
  solved: number;
  attempts: number;
  /** 푼(또는 시도한) 퍼즐 id */
  done: string[];
  /** 오프닝 이름별 [맞힘, 시도] */
  byOpening: Record<string, [number, number]>;
}

export const puzzleStore = createPersistentStore<PuzzleStats>("puzzles", {
  rating: 1200,
  solved: 0,
  attempts: 0,
  done: [],
  byOpening: {},
});

/** 퍼즐 레이팅 갱신 (Elo, K=32) */
export function updatePuzzleRating(
  rating: number,
  puzzleRating: number,
  solved: boolean,
): number {
  const expected = 1 / (1 + 10 ** ((puzzleRating - rating) / 400));
  return Math.round(rating + 32 * ((solved ? 1 : 0) - expected));
}

/** 함정 연습 기록 (id → 걸기/피하기 성공 여부) */
export const trapsStore = createPersistentStore<
  Record<string, { set?: boolean; avoid?: boolean }>
>("traps", {});
