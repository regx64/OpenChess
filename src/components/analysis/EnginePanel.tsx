"use client";

import React from "react";
import type { Analysis } from "@/lib/engine";
import { formatScore, whiteWinChance } from "@/lib/engine";
import type { EngineStatus } from "@/hooks/useEngine";
import { cn } from "@/lib/utils";

/** 평가 막대: 흰 부분이 클수록 백이 유리 */
export function EvalBar({
  analysis,
  orientation,
  className,
  horizontal = false,
}: {
  analysis: Analysis | null;
  orientation: "w" | "b";
  className?: string;
  horizontal?: boolean;
}) {
  const best = analysis?.lines[0];
  const white = best ? whiteWinChance(best) : 0.5;
  const label = best ? formatScore(best) : "";
  // 흰 부분 = 백의 몫. 백 쪽(아래 또는 왼쪽, 뒤집으면 반대)에서부터 채움
  const whiteSide =
    orientation === "w"
      ? horizontal
        ? { left: 0 }
        : { bottom: 0 }
      : horizontal
        ? { right: 0 }
        : { top: 0 };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm bg-neutral-800",
        horizontal ? "h-2.5 w-full" : "h-full w-3",
        className,
      )}
      role="img"
      aria-label={best ? `평가 ${label}` : "평가 계산 중"}
      title={label}
    >
      <div
        className={cn(
          "absolute bg-neutral-100 transition-all duration-500",
          horizontal ? "inset-y-0" : "inset-x-0",
        )}
        style={{
          ...whiteSide,
          [horizontal ? "width" : "height"]: `${white * 100}%`,
        }}
      />
    </div>
  );
}

/**
 * 엔진 분석 결과: 상위 후보 수순과 점수. 수순을 누르면 분석 보드에 변화수로 넣습니다.
 */
export function EnginePanel({
  analysis,
  status,
  onPlayLine,
  moveNumber,
  turn,
}: {
  analysis: Analysis | null;
  status: EngineStatus;
  onPlayLine: (sans: string[]) => void;
  moveNumber: number;
  turn: "w" | "b";
}) {
  if (
    status === "loading" ||
    (status === "running" && !analysis?.lines.length && !analysis?.done)
  ) {
    return (
      <p className="text-xs text-muted-foreground">
        엔진을 준비하는 중… (처음 한 번 약 7MB를 받습니다)
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="text-xs text-destructive">엔진을 불러오지 못했습니다.</p>
    );
  }
  if (!analysis) return null;
  if (analysis.done && !analysis.lines.length) {
    return (
      <p className="text-xs text-muted-foreground">게임이 끝난 위치입니다.</p>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Stockfish 18 · 깊이 {analysis.depth}
          {analysis.done ? "" : "…"}
        </span>
      </div>
      {analysis.lines.map((line) => (
        <button
          key={line.rank}
          type="button"
          onClick={() => onPlayLine(line.san)}
          className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left hover:bg-muted"
          title="이 수순을 변화수로 넣기"
        >
          <span
            className={cn(
              "w-14 shrink-0 rounded px-1 text-center font-mono text-xs font-semibold",
              (line.mate ?? line.cp ?? 0) >= 0
                ? "bg-neutral-100 text-neutral-900"
                : "bg-neutral-800 text-neutral-100",
            )}
          >
            {formatScore(line)}
          </span>
          <span className="min-w-0 truncate font-mono text-xs">
            {line.san
              .slice(0, 8)
              .map((san, i) => {
                const ply = i + (turn === "b" ? 1 : 0);
                const number = moveNumber + Math.floor(ply / 2);
                return ply % 2 === 0
                  ? `${number}. ${san}`
                  : i === 0
                    ? `${number}... ${san}`
                    : san;
              })
              .join(" ")}
          </span>
        </button>
      ))}
    </div>
  );
}
