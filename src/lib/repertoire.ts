import type { BookMove, OpeningBook } from "@/lib/openingBook";
import { GameTree, type MoveNode } from "@/lib/game/tree";

export interface Repertoire {
  id: string;
  name: string;
  /** 내가 두는 색 */
  color: "w" | "b";
  /** 변화수를 포함한 수순 트리 (PGN) */
  pgn: string;
  updated: number;
}

export interface Gap {
  /** 구멍이 있는 위치의 노드 id (레퍼토리 트리 기준) */
  nodeId: number;
  /** 그 위치까지의 수순 */
  line: string;
  /**
   * opponent: 상대가 둘 수 있는 이론 수 중 준비하지 않은 것이 있음
   * mine: 내 차례인데 둘 수를 정하지 않음
   */
  kind: "opponent" | "mine";
  /** opponent: 준비하지 않은 상대 수들 / mine: 이론에 있는 후보 수들 */
  moves: BookMove[];
  depth: number;
}

export interface GapOptions {
  /** 이 수 아래에 이름 붙은 수순이 이만큼 이상 있어야 "주요 수"로 봄 */
  minLines?: number;
  /** 한 위치에서 볼 상대 수 최대 개수 */
  topMoves?: number;
  /** 이 깊이(반수)까지만 봄 */
  maxDepth?: number;
}

/**
 * 레퍼토리의 구멍 찾기.
 * - 상대 차례인 위치마다, 데이터셋의 주요 상대 수 중 레퍼토리에 없는 수
 * - 내 차례인데 레퍼토리가 끝났고, 이론이 더 이어지는 위치
 */
export function findGaps(
  tree: GameTree,
  color: "w" | "b",
  book: OpeningBook,
  { minLines = 3, topMoves = 5, maxDepth = 20 }: GapOptions = {},
): Gap[] {
  const gaps: Gap[] = [];
  const visit = (node: MoveNode, depth: number) => {
    if (depth > maxDepth) return;
    const turn = node.fen.split(" ")[1] as "w" | "b";
    const bookMoves = book.movesFrom(node.fen);
    const covered = new Set(node.children.map((child) => child.san));

    if (turn !== color) {
      const missing = bookMoves
        .slice(0, topMoves)
        .filter((move) => move.lines >= minLines && !covered.has(move.san));
      if (missing.length) {
        gaps.push({
          nodeId: node.id,
          line: tree.linePgn(node),
          kind: "opponent",
          moves: missing,
          depth,
        });
      }
    } else if (
      node.children.length === 0 &&
      bookMoves.some((move) => move.lines >= minLines)
    ) {
      gaps.push({
        nodeId: node.id,
        line: tree.linePgn(node),
        kind: "mine",
        moves: bookMoves.slice(0, 3),
        depth,
      });
    }
    for (const child of node.children) visit(child, depth + 1);
  };
  visit(tree.root, 0);
  // 얕은(먼저 만나는) 구멍부터, 같은 깊이면 상대 수 구멍 먼저
  return gaps.sort(
    (a, b) =>
      a.depth - b.depth ||
      (a.kind === b.kind ? 0 : a.kind === "opponent" ? -1 : 1),
  );
}

/** 레퍼토리의 모든 끝 수순 (처음부터 잎까지, SAN) */
export function repertoireLines(tree: GameTree, limit = 200): string[][] {
  const lines: string[][] = [];
  const visit = (node: MoveNode, path: string[]) => {
    if (lines.length >= limit) return;
    if (!node.children.length) {
      if (path.length) lines.push(path);
      return;
    }
    for (const child of node.children) visit(child, [...path, child.san]);
  };
  visit(tree.root, []);
  return lines;
}

/** 레퍼토리 크기 요약 */
export function repertoireStats(tree: GameTree) {
  let positions = 0;
  const stack = [tree.root];
  while (stack.length) {
    const node = stack.pop()!;
    positions++;
    stack.push(...node.children);
  }
  return {
    positions: positions - 1,
    lines: repertoireLines(tree, 10000).length,
  };
}

/** PGN으로 트리 만들기 (잘못된 PGN이면 빈 트리) */
export function treeOf(repertoire: Pick<Repertoire, "pgn">): GameTree {
  const tree = new GameTree();
  if (repertoire.pgn.trim()) tree.loadPgn(repertoire.pgn);
  tree.toStart();
  return tree;
}

export const newRepertoireId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
