import { describe, expect, test } from "bun:test";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "./openingBook";
import { parsePgn } from "./game/tree";
import { findGaps, repertoireLines, repertoireStats } from "./repertoire";

const book = new OpeningBook(data as unknown as OpeningTreeData);

describe("레퍼토리", () => {
  test("백 1. e4: 흑의 주요 응수 중 준비 안 한 수를 찾음", () => {
    const tree = parsePgn("1. e4 e5 (1... c5 2. Nf3) 2. Nf3 Nc6 3. Bb5");
    const gaps = findGaps(tree, "w", book);
    const first = gaps.find((gap) => gap.line === "1. e4");
    expect(first?.kind).toBe("opponent");
    const missing = first!.moves.map((move) => move.san);
    expect(missing).not.toContain("e5");
    expect(missing).not.toContain("c5");
    expect(missing.length).toBeGreaterThan(0);
    // 백 차례에서 끝난 시실리안 2. Nf3 이후에는 흑 수 구멍, 3. Bb5 이후에도 흑 수 구멍
    expect(
      gaps.some(
        (gap) =>
          gap.line.startsWith("1. e4 c5 2. Nf3") && gap.kind === "opponent",
      ),
    ).toBe(true);
  });

  test("흑 레퍼토리: 1. d4 준비가 없으면 첫 위치부터 구멍", () => {
    const tree = parsePgn("1. e4 c6");
    const gaps = findGaps(tree, "b", book);
    expect(gaps[0].line).toBe("");
    expect(gaps[0].moves.map((m) => m.san)).toContain("d4");
  });

  test("내 차례에서 끝난 수순은 '내 수 미정'", () => {
    const tree = parsePgn("1. e4 e5");
    const gaps = findGaps(tree, "w", book);
    expect(
      gaps.some((gap) => gap.kind === "mine" && gap.line === "1. e4 e5"),
    ).toBe(true);
  });

  test("끝 수순 목록과 크기", () => {
    const tree = parsePgn("1. e4 e5 2. Nf3 (2. Bc4) 2... Nc6");
    expect(repertoireLines(tree)).toEqual([
      ["e4", "e5", "Nf3", "Nc6"],
      ["e4", "e5", "Bc4"],
    ]);
    expect(repertoireStats(tree)).toEqual({ positions: 5, lines: 2 });
  });
});
