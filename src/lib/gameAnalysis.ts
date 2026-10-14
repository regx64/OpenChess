import type { OpeningBook, OpeningName } from "@/lib/openingBook";
import { GameTree, parsePgn, type MoveNode } from "@/lib/game/tree";

export interface ParsedGame {
  headers: Record<string, string>;
  /** 본선 수 (SAN) */
  sans: string[];
  /** 각 수 뒤의 위치 (sans와 같은 길이) */
  fens: string[];
  /** 시작 위치가 표준이 아니면 false */
  standard: boolean;
}

/** 여러 대국이 든 PGN 글을 대국별로 나눕니다 */
export function splitPgnGames(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  if (!/^\s*\[/m.test(normalized)) return [normalized];
  // 헤더 묶음이 시작되는 곳(빈 줄 뒤의 '[')마다 자름
  const chunks = normalized.split(/\n\s*\n(?=\s*\[)/);
  const games: string[] = [];
  let currentHeaders = "";
  for (const chunk of chunks) {
    const isHeaderOnly = /^\s*(\[[^\n]*\]\s*)+$/.test(chunk);
    if (isHeaderOnly) {
      currentHeaders += `${chunk}\n`;
      continue;
    }
    games.push(`${currentHeaders}${chunk}`.trim());
    currentHeaders = "";
  }
  return games;
}

export function parseGame(text: string): ParsedGame | null {
  const headers: Record<string, string> = {};
  for (const [, key, value] of text.matchAll(
    /\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g,
  )) {
    headers[key] = value.replace(/\\"/g, '"');
  }
  let tree: GameTree;
  try {
    tree = parsePgn(text);
  } catch {
    return null;
  }
  const moves = tree.mainlineFrom();
  if (!moves.length) return null;
  return {
    headers,
    sans: moves.map((move) => move.san),
    fens: moves.map((move) => move.fen),
    standard: tree.isStandardStart,
  };
}

export type Outcome = "win" | "loss" | "draw";

export interface GameReport {
  index: number;
  game: ParsedGame;
  /** 내가 둔 색 (이름으로 판별 못 하면 null) */
  myColor: "w" | "b" | null;
  outcome: Outcome | null;
  /** 이론 안에서 마지막으로 이름이 붙은 오프닝 */
  opening: OpeningName | null;
  /** 처음으로 데이터셋에 없는 위치를 만든 수 (반수 번호, 0부터). 끝까지 이론이면 null */
  leftBook: number | null;
  /** 레퍼토리와 비교 */
  repertoire: {
    /** 레퍼토리와 달라진 수 (반수 번호) */
    deviation: number | null;
    /** 누가 다르게 두었는지: 내가 레퍼토리와 다른 수 / 상대가 준비 안 된 수 */
    by: "me" | "opponent" | null;
    /** 내가 다르게 둔 경우, 레퍼토리가 준비한 수 */
    expected: string[];
    /** 레퍼토리를 따라간 반수 */
    followed: number;
  } | null;
}

export const moveLabel = (ply: number, san: string) =>
  `${Math.floor(ply / 2) + 1}${ply % 2 === 0 ? "." : "..."} ${san}`;

const normalizeName = (name: string) => name.trim().toLowerCase();

export function analyzeGame(
  game: ParsedGame,
  index: number,
  book: OpeningBook,
  {
    myName,
    repertoires = {},
  }: {
    myName?: string;
    repertoires?: Partial<Record<"w" | "b", GameTree>>;
  } = {},
): GameReport {
  const name = myName ? normalizeName(myName) : "";
  const white = normalizeName(game.headers.White ?? "");
  const black = normalizeName(game.headers.Black ?? "");
  const myColor: "w" | "b" | null =
    name && white === name ? "w" : name && black === name ? "b" : null;

  const result = game.headers.Result;
  let outcome: Outcome | null = null;
  if (myColor && result && result !== "*") {
    if (result === "1/2-1/2") outcome = "draw";
    else outcome = (result === "1-0") === (myColor === "w") ? "win" : "loss";
  }

  let opening: OpeningName | null = null;
  let leftBook: number | null = null;
  if (game.standard) {
    for (const [ply, fen] of game.fens.entries()) {
      if (!book.nodesAt(fen).length) {
        leftBook = ply;
        break;
      }
      opening = book.openingAt(fen) ?? opening;
    }
  }

  let repertoire: GameReport["repertoire"] = null;
  const tree = myColor ? repertoires[myColor] : undefined;
  if (tree && game.standard) {
    let node: MoveNode = tree.root;
    let deviation: number | null = null;
    let by: "me" | "opponent" | null = null;
    let expected: string[] = [];
    let followed = 0;
    for (const [ply, san] of game.sans.entries()) {
      if (!node.children.length) break; // 레퍼토리가 여기까지
      const next = node.children.find((child) => child.san === san);
      if (!next) {
        deviation = ply;
        const mine = (ply % 2 === 0) === (myColor === "w");
        by = mine ? "me" : "opponent";
        expected = mine ? node.children.map((child) => child.san) : [];
        break;
      }
      node = next;
      followed = ply + 1;
    }
    repertoire = { deviation, by, expected, followed };
  }

  return { index, game, myColor, outcome, opening, leftBook, repertoire };
}

export interface OpeningSummary {
  /** 오프닝 계열 이름 (":" 앞부분) */
  family: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  /** 평균 이론 길이 (반수) */
  averageBook: number;
}

/** 오프닝 계열별 성적 */
export function summarizeByOpening(reports: GameReport[]): OpeningSummary[] {
  const groups = new Map<string, GameReport[]>();
  for (const report of reports) {
    const family = report.opening?.name.split(":")[0] ?? "알 수 없음";
    groups.set(family, [...(groups.get(family) ?? []), report]);
  }
  return [...groups.entries()]
    .map(([family, list]) => ({
      family,
      games: list.length,
      wins: list.filter((r) => r.outcome === "win").length,
      draws: list.filter((r) => r.outcome === "draw").length,
      losses: list.filter((r) => r.outcome === "loss").length,
      averageBook:
        list.reduce((sum, r) => sum + (r.leftBook ?? r.game.sans.length), 0) /
        list.length,
    }))
    .sort((a, b) => b.games - a.games);
}
