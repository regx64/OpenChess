/**
 * 간격 반복(SRS) 일정 계산. SM-2를 단순화한 방식입니다.
 * - 맞히면 복습 간격이 점점 늘어나고(1일 → 3일 → 간격×쉬움 정도), 틀리면 다시 짧아집니다.
 * - 날짜는 "일 단위 번호"(UTC 기준 1970-01-01부터 며칠째)로 저장합니다.
 */

export interface CardState {
  /** 복습 간격 (일) */
  interval: number;
  /** 쉬움 정도 (1.3–2.8) */
  ease: number;
  /** 연속으로 맞힌 횟수 */
  reps: number;
  /** 틀린 총 횟수 */
  lapses: number;
  /** 다음 복습 날짜 (일 번호) */
  due: number;
  /** 마지막으로 연습한 날짜 (일 번호) */
  last: number;
  /** 지금까지 연습한 총 횟수 */
  seen: number;
}

/** 연습 결과: 틀림 / 힌트를 보고 맞힘 / 한 번에 맞힘 */
export type Grade = "again" | "hard" | "good";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 오늘의 일 번호 */
export const today = (now: number = Date.now()): number =>
  Math.floor(now / DAY_MS);

/** 이 간격(일) 이상이면 "마스터"로 봄 */
export const MASTERED_INTERVAL = 21;

export function newCard(day: number = today()): CardState {
  return {
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    due: day,
    last: day,
    seen: 0,
  };
}

/** 결과에 따라 다음 복습 일정을 계산 */
export function review(
  card: CardState,
  grade: Grade,
  day: number = today(),
): CardState {
  const next: CardState = { ...card, last: day, seen: card.seen + 1 };
  if (grade === "again") {
    next.reps = 0;
    next.lapses = card.lapses + 1;
    next.ease = Math.max(1.3, card.ease - 0.2);
    next.interval = 0;
    next.due = day; // 오늘 다시
    return next;
  }
  const easeChange = grade === "hard" ? -0.15 : 0.05;
  next.ease = Math.min(2.8, Math.max(1.3, card.ease + easeChange));
  next.reps = card.reps + 1;
  if (next.reps === 1) next.interval = grade === "hard" ? 1 : 1;
  else if (next.reps === 2) next.interval = grade === "hard" ? 2 : 3;
  else
    next.interval = Math.round(
      card.interval * (grade === "hard" ? 1.2 : next.ease),
    );
  next.interval = Math.max(1, next.interval);
  next.due = day + next.interval;
  return next;
}

export type CardLevel = "new" | "learning" | "known" | "mastered";

/** 카드의 숙련 단계 */
export function cardLevel(card: CardState | undefined): CardLevel {
  if (!card || card.seen === 0) return "new";
  if (card.interval >= MASTERED_INTERVAL) return "mastered";
  if (card.reps >= 2) return "known";
  return "learning";
}

export const LEVEL_LABELS: Record<CardLevel, string> = {
  new: "처음",
  learning: "익히는 중",
  known: "익힘",
  mastered: "마스터",
};
