import { describe, expect, test } from "bun:test";
import { formatScore, parseInfo, pvToSan, whiteWinChance } from "./engine";

describe("엔진 출력 읽기", () => {
  test("info 줄", () => {
    const info = parseInfo(
      "info depth 18 seldepth 24 multipv 2 score cp -35 nodes 123 nps 1000 time 50 pv e7e5 g1f3 b8c6",
    );
    expect(info).toEqual({
      depth: 18,
      rank: 2,
      cp: -35,
      mate: null,
      pv: ["e7e5", "g1f3", "b8c6"],
    });
    expect(parseInfo("info depth 5 score mate 3 pv d1h5")?.mate).toBe(3);
    expect(
      parseInfo("info depth 10 score cp 20 lowerbound pv e2e4"),
    ).toBeNull();
    expect(parseInfo("info string NNUE evaluation")).toBeNull();
  });
  test("UCI → SAN", () => {
    expect(
      pvToSan("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [
        "e2e4",
        "e7e5",
        "g1f3",
      ]),
    ).toEqual(["e4", "e5", "Nf3"]);
    expect(pvToSan("8/P7/8/8/8/8/8/k6K w - - 0 1", ["a7a8q"])).toEqual([
      "a8=Q+",
    ]);
  });
  test("점수 표시와 승률", () => {
    expect(formatScore({ cp: 35, mate: null })).toBe("+0.35");
    expect(formatScore({ cp: -120, mate: null })).toBe("−1.20");
    expect(formatScore({ cp: null, mate: -2 })).toBe("#-2");
    expect(whiteWinChance({ cp: 0, mate: null })).toBeCloseTo(0.5);
    expect(whiteWinChance({ cp: null, mate: 3 })).toBe(1);
  });
});
