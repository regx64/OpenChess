import type { CatalogEntry, OpeningBook } from "@/lib/openingBook";
import { type CardState, today as todayNumber } from "./srs";

/** 연습할 수순 하나 (= 오프닝 이름 하나) */
export interface TrainingLine {
  name: string;
  eco: string;
  sans: string[];
}

const catalogByName = new WeakMap<OpeningBook, Map<string, CatalogEntry>>();

/** 이름으로 대표 수순 찾기 */
export function lineForName(
  book: OpeningBook,
  name: string,
): TrainingLine | null {
  let map = catalogByName.get(book);
  if (!map) {
    map = new Map(book.catalog().map((entry) => [entry.name, entry]));
    catalogByName.set(book, map);
  }
  const entry = map.get(name);
  return entry
    ? { name: entry.name, eco: entry.eco, sans: book.path(entry.node) }
    : null;
}

/**
 * 오프닝 아래에 있는 이름 붙은 수순들 (자기 자신 포함, 얕은 것부터).
 * 같은 이름은 대표 수순 하나만 씁니다.
 */
export function linesUnder(
  book: OpeningBook,
  entry: CatalogEntry,
  { maxLines = 300, maxPlies = 30 } = {},
): TrainingLine[] {
  const seen = new Set<string>();
  const lines: TrainingLine[] = [];
  const queue = [entry.node];
  while (queue.length && lines.length < maxLines) {
    const node = queue.shift()!;
    const opening = book.opening(node);
    if (opening && !seen.has(opening.name)) {
      seen.add(opening.name);
      const line = lineForName(book, opening.name);
      if (line && line.sans.length <= maxPlies) lines.push(line);
    }
    queue.push(...book.children[node]);
  }
  return lines;
}

export interface SessionItem {
  line: TrainingLine;
  status: "due" | "new";
}

/**
 * 이번 연습 목록: 복습할 때가 된 수순 먼저(오래 기다린 순), 그다음 처음 보는 수순(짧은 순)
 */
export function buildSession(
  lines: TrainingLine[],
  cards: Record<string, CardState>,
  color: "w" | "b",
  { limit = 10, day = todayNumber(), includeNew = true } = {},
): SessionItem[] {
  const due: { line: TrainingLine; due: number }[] = [];
  const fresh: TrainingLine[] = [];
  for (const line of lines) {
    const card = cards[`${color}|${line.name}`];
    if (!card || card.seen === 0) fresh.push(line);
    else if (card.due <= day) due.push({ line, due: card.due });
  }
  due.sort((a, b) => a.due - b.due);
  fresh.sort((a, b) => a.sans.length - b.sans.length);
  return [
    ...due.map(({ line }) => ({ line, status: "due" as const })),
    ...(includeNew
      ? fresh.map((line) => ({ line, status: "new" as const }))
      : []),
  ].slice(0, limit);
}

/** 모든 카드 중 복습할 때가 된 것 (색, 이름) */
export function dueCards(
  cards: Record<string, CardState>,
  day: number = todayNumber(),
): { color: "w" | "b"; name: string; due: number }[] {
  return Object.entries(cards)
    .filter(([, card]) => card.seen > 0 && card.due <= day)
    .map(([key, card]) => {
      const [color, ...rest] = key.split("|");
      return { color: color as "w" | "b", name: rest.join("|"), due: card.due };
    })
    .sort((a, b) => a.due - b.due);
}
