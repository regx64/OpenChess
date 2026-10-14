import { describe, expect, test } from "bun:test";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "./openingBook";
import { parsePgn } from "./game/tree";
import {
  analyzeGame,
  parseGame,
  splitPgnGames,
  summarizeByOpening,
} from "./gameAnalysis";

const book = new OpeningBook(data as unknown as OpeningTreeData);

const PGN = `[Event "Casual"]
[White "me"]
[Black "Opp"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Na5 11. Qa4+ c6 12. Bxd5 1-0

[Event "Casual"]
[White "Opp"]
[Black "Me"]
[Result "1-0"]

1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b6 7. h4 1-0
`;

describe("내 기보 분석", () => {
  test("여러 대국 나누기와 읽기", () => {
    const games = splitPgnGames(PGN);
    expect(games).toHaveLength(2);
    const game = parseGame(games[0])!;
    expect(game.headers.White).toBe("me");
    expect(game.sans.slice(0, 3)).toEqual(["e4", "e5", "Nf3"]);
    expect(splitPgnGames("1. e4 e5")).toEqual(["1. e4 e5"]);
  });

  test("색·결과·오프닝·이론 이탈", () => {
    const [first, second] = splitPgnGames(PGN).map((text) => parseGame(text)!);
    const a = analyzeGame(first, 0, book, { myName: "ME" });
    expect(a.myColor).toBe("w");
    expect(a.outcome).toBe("win");
    expect(a.opening?.name).toContain("Italian Game");
    const b = analyzeGame(second, 1, book, { myName: "me" });
    expect(b.myColor).toBe("b");
    expect(b.outcome).toBe("loss");
    expect(b.opening?.name).toContain("Nimzo-Indian");
    // 7. h4는 데이터셋에 없는 수
    expect(b.leftBook).toBe(12);
  });

  test("레퍼토리와 비교", () => {
    const [first, second] = splitPgnGames(PGN).map((text) => parseGame(text)!);
    const white = parsePgn("1. e4 e5 2. Nf3 Nc6 3. Bb5");
    const black = parsePgn("1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 d5");
    const a = analyzeGame(first, 0, book, {
      myName: "me",
      repertoires: { w: white, b: black },
    });
    expect(a.repertoire).toEqual({
      deviation: 4,
      by: "me",
      expected: ["Bb5"],
      followed: 4,
    });
    const b = analyzeGame(second, 1, book, {
      myName: "me",
      repertoires: { w: white, b: black },
    });
    expect(b.repertoire?.by).toBe("me");
    expect(b.repertoire?.expected).toEqual(["d5"]);
  });

  test("오프닝별 성적", () => {
    const reports = splitPgnGames(PGN).map((text, i) =>
      analyzeGame(parseGame(text)!, i, book, { myName: "me" }),
    );
    const summary = summarizeByOpening(reports);
    expect(summary.map((s) => s.family).sort()).toEqual([
      "Italian Game",
      "Nimzo-Indian Defense",
    ]);
    expect(summary.find((s) => s.family === "Italian Game")?.wins).toBe(1);
  });
});
