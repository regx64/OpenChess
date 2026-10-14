import { describe, expect, test } from "bun:test";
import { Chess } from "chess.js";
import { TRAPS } from "@/data/traps";
import { MODEL_GAMES } from "@/data/games";

const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** 백 기준 기물 점수 차 */
function material(game: Chess): number {
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece) score += (piece.color === "w" ? 1 : -1) * VALUES[piece.type];
    }
  }
  return score;
}

describe("함정", () => {
  for (const trap of TRAPS) {
    test(trap.title, () => {
      const game = new Chess();
      game.loadPgn(trap.pgn);
      const history = game.history({ verbose: true });

      // 실수 수가 적힌 위치에 있고, 함정에 걸리는 쪽이 둔 수
      expect(history[trap.blunderPly].san).toBe(trap.blunder);
      expect(history[trap.blunderPly].color).not.toBe(trap.trapper);

      if (trap.outcome === "mate") {
        expect(game.isCheckmate()).toBe(true);
        expect(game.turn()).not.toBe(trap.trapper);
      } else if (trap.outcome === "material") {
        const gain = trap.trapper === "w" ? material(game) : -material(game);
        expect(gain).toBeGreaterThanOrEqual(2);
      } else {
        // 갇힌 비숍: 갈 수 있는 칸이 모두 상대 폰에게 잡히는 칸
        const bishop = game
          .board()
          .flat()
          .find(
            (p) =>
              p?.type === "b" && p.color !== trap.trapper && p.square === "b3",
          );
        expect(bishop).toBeTruthy();
        game.load(game.fen().replace(/ b /, " w "));
        const moves = game.moves({ square: "b3", verbose: true });
        for (const move of moves) {
          expect(["a4", "c4"]).toContain(move.to);
        }
      }

      // 대신 둘 수 있는 수는 실수 직전 위치에서 둘 수 있어야 함
      if (trap.safe) {
        const before = new Chess();
        for (const move of history.slice(0, trap.blunderPly))
          before.move(move.san);
        expect(() => before.move(trap.safe!)).not.toThrow();
        expect(trap.safe).not.toBe(trap.blunder);
      }
    });
  }

  test("id가 겹치지 않음", () => {
    expect(new Set(TRAPS.map((t) => t.id)).size).toBe(TRAPS.length);
  });
});

describe("명국", () => {
  for (const game of MODEL_GAMES) {
    test(game.title, () => {
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      // 메이트로 끝난 대국은 결과가 맞는지 확인
      if (chess.isCheckmate()) {
        expect(game.result).toBe(chess.turn() === "w" ? "0-1" : "1-0");
      }
      expect(chess.history().length).toBeGreaterThan(20);
    });
  }
});
