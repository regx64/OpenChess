"use client";

import type { CourseStep } from "@/data/courses";
import { createPersistentStore } from "@/lib/storage";
import { normalizeFileName } from "@/lib/utils";
import type { CardState } from "./srs";
import type { PuzzleStats } from "./progress";

/** 코스별로 직접 체크한 단계 (코스 id → 단계 번호들) */
export const courseChecksStore = createPersistentStore<
  Record<string, number[]>
>("course-checks", {});

export interface ProgressSources {
  viewed: Record<string, number>;
  cards: Record<string, CardState>;
  traps: Record<string, { set?: boolean; avoid?: boolean }>;
  puzzles: PuzzleStats;
  /** 문서 slug → 영문 이름 */
  docNames: Record<string, string>;
}

/** 학습 기록으로 단계 완료를 판단 (판단할 수 없는 단계는 null) */
export function autoDone(
  step: CourseStep,
  sources: ProgressSources,
): boolean | null {
  switch (step.kind) {
    case "doc": {
      const name = sources.docNames[step.target!];
      return name ? sources.viewed[name] !== undefined : null;
    }
    case "drill":
      return (sources.cards[`${step.color}|${step.target}`]?.seen ?? 0) > 0;
    case "trap": {
      const record = sources.traps[step.target!];
      return Boolean(record?.set || record?.avoid);
    }
    case "puzzles":
      return (sources.puzzles.byOpening[step.target!]?.[1] ?? 0) >= 5;
    default:
      return null;
  }
}

/** 단계로 가는 주소 */
export function stepHref(step: CourseStep): string {
  switch (step.kind) {
    case "doc":
      return `/openings/${step.target}`;
    case "drill":
      return `/train/drill?opening=${normalizeFileName(step.target!)}&color=${step.color}`;
    case "trap":
      return `/train/traps/${step.target}`;
    case "puzzles":
      return `/train/puzzles?opening=${encodeURIComponent(step.target!)}`;
    case "game":
      return `/train/games/${step.target}`;
    case "quiz":
      return "/train/quiz";
  }
}
