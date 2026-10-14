import { Chess, type Square } from "chess.js";
import { fenToEpd } from "@/lib/epd";

export type GameEndKind =
  "checkmate" | "stalemate" | "repetition" | "fifty-move" | "insufficient";

export interface PositionStatus {
  turn: "w" | "b";
  /** 체크 중이면 체크당한 킹의 칸 */
  checkSquare: Square | null;
  end: { kind: GameEndKind; winner: "w" | "b" | null } | null;
}

export const GAME_END_LABELS: Record<GameEndKind, string> = {
  checkmate: "체크메이트",
  stalemate: "스테일메이트",
  repetition: "3회 동형 반복",
  "fifty-move": "50수 규칙",
  insufficient: "기물 부족",
};

const engine = new Chess();

/**
 * 위치의 상태(체크, 게임 종료)를 판정합니다.
 * @param history - 처음부터 이 위치까지의 FEN 목록 (3회 반복 판정용, 마지막이 현재 위치)
 */
export function positionStatus(
  fen: string,
  history: string[] = [fen],
): PositionStatus {
  engine.load(fen);
  const turn = engine.turn();

  let checkSquare: Square | null = null;
  if (engine.inCheck()) {
    for (const row of engine.board()) {
      for (const piece of row) {
        if (piece?.type === "k" && piece.color === turn)
          checkSquare = piece.square;
      }
    }
  }

  const epd = fenToEpd(fen);
  const repetitions = history.filter((h) => fenToEpd(h) === epd).length;
  const halfmoves = Number(fen.split(" ")[4]) || 0;

  let end: PositionStatus["end"] = null;
  if (engine.isCheckmate())
    end = { kind: "checkmate", winner: turn === "w" ? "b" : "w" };
  else if (engine.isStalemate()) end = { kind: "stalemate", winner: null };
  else if (engine.isInsufficientMaterial())
    end = { kind: "insufficient", winner: null };
  else if (repetitions >= 3) end = { kind: "repetition", winner: null };
  else if (halfmoves >= 100) end = { kind: "fifty-move", winner: null };

  return { turn, checkSquare, end };
}

/** 게임 종료 안내 문구 (예: "체크메이트 · 백 승") */
export function describeEnd(end: NonNullable<PositionStatus["end"]>): string {
  const result =
    end.winner === "w" ? "백 승" : end.winner === "b" ? "흑 승" : "무승부";
  return `${GAME_END_LABELS[end.kind]} · ${result}`;
}
