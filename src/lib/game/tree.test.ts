import { describe, expect, test } from "bun:test";
import { GameTree, parsePgn } from "./tree";

describe("GameTree", () => {
  test("수를 두고 앞뒤로 이동", () => {
    const tree = new GameTree();
    tree.playLine(["e4", "e5", "Nf3"]);
    expect(tree.linePgn()).toBe("1. e4 e5 2. Nf3");
    tree.back();
    expect(tree.current.san).toBe("e5");
    tree.toStart();
    expect(tree.current).toBe(tree.root);
    tree.toEnd();
    expect(tree.current.san).toBe("Nf3");
  });

  test("중간에서 다른 수를 두면 변화수로 남음", () => {
    const tree = new GameTree();
    tree.playLine(["e4", "e5", "Nf3"]);
    tree.back();
    tree.play("Bc4");
    const e5 = tree.current.parent!;
    expect(e5.children.map((n) => n.san)).toEqual(["Nf3", "Bc4"]);
    expect(tree.isMainline(tree.current)).toBe(false);
    expect(tree.toPgn()).toBe("1. e4 e5 2. Nf3 (2. Bc4)");

    tree.promote(tree.current);
    expect(tree.toPgn()).toBe("1. e4 e5 2. Bc4 (2. Nf3)");
  });

  test("같은 수를 다시 두면 새 노드를 만들지 않음", () => {
    const tree = new GameTree();
    tree.play("e4");
    tree.back();
    tree.play("e4");
    expect(tree.root.children).toHaveLength(1);
  });

  test("둘 수 없는 수는 무시", () => {
    const tree = new GameTree();
    expect(tree.play("e5")).toBeNull();
    expect(tree.play({ from: "e2", to: "e5" })).toBeNull();
    expect(tree.current).toBe(tree.root);
  });

  test("노드 삭제 시 현재 위치는 부모로", () => {
    const tree = new GameTree();
    tree.playLine(["d4", "d5", "c4"]);
    const d5 = tree.current.parent!;
    tree.remove(d5);
    expect(tree.current.san).toBe("d4");
    expect(tree.toPgn()).toBe("1. d4");
  });

  test("승격", () => {
    const tree = new GameTree("8/P7/8/8/8/8/8/k6K w - - 0 1");
    expect(tree.play({ from: "a7", to: "a8", promotion: "n" })?.san).toBe(
      "a8=N",
    );
  });
});

describe("PGN", () => {
  test("변화수·주석·NAG 왕복", () => {
    const pgn =
      "1. e4 e5 2. Nf3 $1 { 가장 흔한 수 } (2. f4 exf4 (2... d5) 3. Nf3) 2... Nc6 3. Bb5 a6";
    const tree = parsePgn(pgn);
    expect(tree.toPgn()).toBe(pgn);
  });

  test("헤더와 결과, 수 뒤 평가 기호", () => {
    const tree = parsePgn(
      '[Event "Test"]\n[White "A"]\n\n1.e4 e5 2.Nf3!? Nc6 3.Bb5 1-0',
    );
    expect(tree.linePgn(tree.mainlineFrom().at(-1))).toBe(
      "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    );
    expect(tree.mainlineFrom()[2].nags).toEqual([5]);
  });

  test("0-0 표기와 흑 차례 FEN", () => {
    const tree = parsePgn(
      '[FEN "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"]\n2... Nc6 3. Bc4 Nf6 4. 0-0',
    );
    expect(tree.toPgn()).toContain("2... Nc6 3. Bc4 Nf6 4. O-O");
  });

  test("잘못된 PGN은 실패하고 트리를 유지", () => {
    const tree = new GameTree();
    tree.play("e4");
    expect(tree.loadPgn("1. e4 e5 2. Ke3")).toBe(false);
    expect(tree.linePgn()).toBe("1. e4");
    expect(tree.loadPgn("1. e4 (1. d4")).toBe(false);
  });

  test("loadPgn 후 본선 끝으로 이동", () => {
    const tree = new GameTree();
    expect(tree.loadPgn("1. d4 Nf6 2. c4 e6")).toBe(true);
    expect(tree.current.san).toBe("e6");
  });
});
