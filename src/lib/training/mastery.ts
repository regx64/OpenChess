import type { CatalogEntry } from "@/lib/openingBook";
import { cardLevel, type CardLevel, type CardState } from "./srs";

export interface MasteryInput {
  catalog: CatalogEntry[];
  cards: Record<string, CardState>;
  viewed: Record<string, number>;
  /** 퀴즈에서 맞힌 오프닝 이름 */
  quizSolved: string[];
}

export type NameStatus = "unseen" | "seen" | CardLevel;

const LEVEL_ORDER: CardLevel[] = ["new", "learning", "known", "mastered"];

/** 오프닝 이름 하나의 상태: 백·흑 카드 중 높은 단계, 카드가 없으면 본 적이 있는지 */
export function nameStatus(
  name: string,
  input: Omit<MasteryInput, "catalog">,
): NameStatus {
  const levels = (["w", "b"] as const)
    .map((color) => input.cards[`${color}|${name}`])
    .filter(Boolean)
    .map((card) => cardLevel(card));
  const best = levels.sort(
    (a, b) => LEVEL_ORDER.indexOf(b) - LEVEL_ORDER.indexOf(a),
  )[0];
  if (best && best !== "new") return best;
  if (input.viewed[name] !== undefined || input.quizSolved.includes(name))
    return "seen";
  return "unseen";
}

export interface MasterySummary {
  total: number;
  /** 본 것(페이지·퀴즈·연습 중 하나라도) */
  seen: number;
  /** 익힘 이상 (트레이너에서 두 번 이상 맞힘) */
  learned: number;
  mastered: number;
  /** 이름 → 상태 */
  status: Map<string, NameStatus>;
}

export function summarizeMastery(input: MasteryInput): MasterySummary {
  const status = new Map<string, NameStatus>();
  let seen = 0;
  let learned = 0;
  let mastered = 0;
  for (const { name } of input.catalog) {
    const s = nameStatus(name, input);
    status.set(name, s);
    if (s !== "unseen") seen++;
    if (s === "known" || s === "mastered") learned++;
    if (s === "mastered") mastered++;
  }
  return { total: input.catalog.length, seen, learned, mastered, status };
}

/** 정복 단계 칭호 (익힌 오프닝 수 기준) */
export const RANKS: { min: number; title: string }[] = [
  { min: 0, title: "첫걸음" },
  { min: 5, title: "오프닝 입문자" },
  { min: 20, title: "오프닝 수련생" },
  { min: 60, title: "이론 탐구자" },
  { min: 150, title: "레퍼토리 장인" },
  { min: 400, title: "오프닝 마스터" },
  { min: 1000, title: "오프닝 백과사전" },
  { min: 3177, title: "모든 오프닝 정복자" },
];

export function rankFor(learned: number) {
  const index = RANKS.findLastIndex((rank) => learned >= rank.min);
  return { current: RANKS[index], next: RANKS[index + 1] ?? null };
}

export interface GroupProgress {
  key: string;
  total: number;
  seen: number;
  learned: number;
}

/** 묶음별(ECO 코드, 오프닝 계열) 진도 */
export function groupProgress(
  catalog: CatalogEntry[],
  status: Map<string, NameStatus>,
  keyOf: (entry: CatalogEntry) => string,
): Map<string, GroupProgress> {
  const groups = new Map<string, GroupProgress>();
  for (const entry of catalog) {
    const key = keyOf(entry);
    const group = groups.get(key) ?? { key, total: 0, seen: 0, learned: 0 };
    const s = status.get(entry.name) ?? "unseen";
    group.total++;
    if (s !== "unseen") group.seen++;
    if (s === "known" || s === "mastered") group.learned++;
    groups.set(key, group);
  }
  return groups;
}
