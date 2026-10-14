"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { Arrow, BoardMove } from "@/components/board/Board";
import { playSound, soundForSan } from "@/lib/sound";
import { INITIAL_FEN } from "@/types/chess";

/**
 * 사용자가 둔 수의 판정
 * - correct: 정답, 다음으로 진행
 * - alternative: 틀리진 않았지만 이번 연습의 수가 아님 (실수로 세지 않고 되돌림)
 * - wrong: 실수 (되돌림)
 * - finish: 이 수로 성공 종료
 * - fail: 이 수를 둔 채로 실패 종료
 */
export type Verdict = "correct" | "alternative" | "wrong" | "finish" | "fail";

export interface DrillFeedback {
  kind: "info" | "success" | "error" | "warning";
  text: string;
}

export interface DrillResult {
  success: boolean;
  mistakes: number;
  hints: number;
}

export interface LineDrillOptions {
  /** 연습할 수순 (SAN) */
  sans: string[];
  startFen?: string;
  /** 사용자가 두는 쪽 */
  userColor: "w" | "b";
  /** 기본 판정(정답과 같으면 correct, 아니면 wrong)을 바꾸고 싶을 때 */
  judge?: (ply: number, san: string, fenBefore: string) => Verdict | null;
  /** 판정에 대한 안내 문구를 바꾸고 싶을 때 */
  describe?: (verdict: Verdict, ply: number, san: string) => string | null;
  /** 끝났을 때 */
  onFinish?: (result: DrillResult) => void;
  /** 상대 수를 자동으로 두기 전 기다리는 시간 (ms) */
  autoDelay?: number;
  /** 같은 수순을 다시 시작하게 하는 값 (바뀌면 처음부터) */
  resetKey?: unknown;
}

const moveSquares = (
  fen: string,
  san: string | { from: string; to: string; promotion?: string },
) => {
  const chess = new Chess(fen);
  const move = chess.move(san);
  return {
    from: move.from as Square,
    to: move.to as Square,
    fen: chess.fen(),
    san: move.san,
  };
};

/**
 * 정해진 수순을 따라 두는 연습. 상대 쪽 수는 자동으로 두고, 사용자 수를 판정합니다.
 */
export function useLineDrill({
  sans,
  startFen = INITIAL_FEN,
  userColor,
  judge,
  describe,
  onFinish,
  autoDelay = 450,
  resetKey,
}: LineDrillOptions) {
  // 배열이 매번 새로 만들어져도 내용이 같으면 같은 수순으로 봄
  const lineKey = sans.join(" ");
  // 각 수 뒤의 위치를 미리 계산
  const positions = useMemo(() => {
    const list: { fen: string; from?: Square; to?: Square; san?: string }[] = [
      { fen: startFen },
    ];
    for (const san of sans) {
      try {
        list.push(moveSquares(list[list.length - 1].fen, san));
      } catch {
        break;
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey, startFen]);

  const [ply, setPly] = useState(0);
  /** 정답 수순을 벗어난 수를 두어 끝난 경우의 위치 */
  const [offLine, setOffLine] = useState<{
    fen: string;
    from: Square;
    to: Square;
  } | null>(null);
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);
  const [hintArrow, setHintArrow] = useState<Arrow | null>(null);
  const [finished, setFinished] = useState<DrillResult | null>(null);
  const stats = useRef({ mistakes: 0, hints: 0, wrongHere: 0 });
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const total = positions.length - 1;
  const turnAt = (index: number) =>
    (positions[index].fen.split(" ")[1] as "w" | "b") ?? "w";
  const isUserTurn = !finished && ply < total && turnAt(ply) === userColor;

  const finish = useCallback((success: boolean) => {
    const result = {
      success,
      mistakes: stats.current.mistakes,
      hints: stats.current.hints,
    };
    setFinished(result);
    onFinishRef.current?.(result);
  }, []);

  const restart = useCallback(() => {
    setPly(0);
    setOffLine(null);
    setFeedback(null);
    setHintArrow(null);
    setFinished(null);
    stats.current = { mistakes: 0, hints: 0, wrongHere: 0 };
  }, []);

  useEffect(restart, [restart, lineKey, startFen, userColor, resetKey]);

  // 상대 차례면 자동으로 두기, 끝까지 두면 성공
  useEffect(() => {
    if (finished) return;
    if (ply >= total) {
      if (total > 0) {
        playSound("success");
        setFeedback({ kind: "success", text: "수순을 끝까지 두었습니다!" });
        finish(true);
      }
      return;
    }
    if (turnAt(ply) === userColor) return;
    const timer = setTimeout(() => {
      playSound(soundForSan(positions[ply + 1].san!));
      setPly((p) => p + 1);
    }, autoDelay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, total, finished, userColor, positions]);

  const userMove = useCallback(
    (move: BoardMove) => {
      if (!isUserTurn) return;
      const before = positions[ply].fen;
      let played;
      try {
        played = moveSquares(before, move);
      } catch {
        return;
      }
      const expected = positions[ply + 1]?.san;
      const verdict =
        judge?.(ply, played.san, before) ??
        (played.san === expected ? "correct" : "wrong");
      const custom = describe?.(verdict, ply, played.san);
      setHintArrow(null);

      switch (verdict) {
        case "correct":
          playSound(soundForSan(played.san));
          stats.current.wrongHere = 0;
          setFeedback(custom ? { kind: "success", text: custom } : null);
          setPly(ply + 1);
          break;
        case "alternative":
          playSound("error");
          setFeedback({
            kind: "warning",
            text:
              custom ??
              `${played.san}도 이론 수이지만, 이번 수순은 다른 수로 이어집니다.`,
          });
          break;
        case "wrong": {
          playSound("error");
          stats.current.mistakes++;
          stats.current.wrongHere++;
          // 두 번 틀리면 정답을 화살표로 보여 줌
          const reveal = stats.current.wrongHere >= 2 && positions[ply + 1];
          if (reveal) {
            setHintArrow({
              from: positions[ply + 1].from!,
              to: positions[ply + 1].to!,
              color: "green",
            });
          }
          setFeedback({
            kind: "error",
            text:
              custom ??
              (reveal
                ? `정답은 ${expected}입니다. 화살표대로 두어 보세요.`
                : `${played.san}는 이 수순의 수가 아닙니다. 다시 생각해 보세요.`),
          });
          break;
        }
        case "finish":
          playSound("success");
          setOffLine({ fen: played.fen, from: played.from, to: played.to });
          setFeedback({ kind: "success", text: custom ?? "성공!" });
          finish(true);
          break;
        case "fail":
          playSound(soundForSan(played.san));
          setOffLine({ fen: played.fen, from: played.from, to: played.to });
          setFeedback({ kind: "error", text: custom ?? "실패했습니다." });
          finish(false);
          break;
      }
    },
    [isUserTurn, positions, ply, judge, describe, finish],
  );

  /** 정답 수를 화살표로 보여 줌 (힌트로 셈) */
  const hint = useCallback(() => {
    const next = positions[ply + 1];
    if (!isUserTurn || !next) return;
    stats.current.hints++;
    setHintArrow({ from: next.from!, to: next.to!, color: "green" });
    setFeedback({ kind: "info", text: "화살표가 정답입니다." });
  }, [isUserTurn, positions, ply]);

  const current = offLine ?? positions[ply];
  return {
    fen: current.fen,
    lastMove:
      current.from && current.to
        ? { from: current.from, to: current.to }
        : null,
    ply,
    total,
    isUserTurn,
    feedback,
    setFeedback,
    arrows: hintArrow ? [hintArrow] : [],
    finished,
    userMove,
    hint,
    restart,
    stats: stats.current,
    /** 지금까지 둔 수 (SAN) */
    played: positions.slice(1, ply + 1).map((p) => p.san!),
  };
}
