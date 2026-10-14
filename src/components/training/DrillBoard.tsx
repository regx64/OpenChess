"use client";

import React from "react";
import { Lightbulb, RotateCcw } from "lucide-react";
import Board from "@/components/board/Board";
import { Button } from "@/components/ui/button";
import type { useLineDrill } from "@/hooks/useLineDrill";
import { cn } from "@/lib/utils";

type Drill = ReturnType<typeof useLineDrill>;

const FEEDBACK_STYLES = {
  info: "border-sky-500/40 bg-sky-500/10",
  success: "border-primary/50 bg-primary/10",
  error: "border-destructive/50 bg-destructive/10",
  warning: "border-amber-500/50 bg-amber-500/10",
};

/** 연습용 보드: 보드 + 진행 막대 + 안내 + 힌트/다시 버튼 */
export function DrillBoard({
  drill,
  userColor,
  showHint = true,
  className,
  children,
}: {
  drill: Drill;
  userColor: "w" | "b";
  showHint?: boolean;
  className?: string;
  /** 보드 아래에 덧붙일 내용 */
  children?: React.ReactNode;
}) {
  const progress = drill.total ? (drill.ply / drill.total) * 100 : 0;
  return (
    <div className={cn("space-y-3", className)}>
      <Board
        fen={drill.fen}
        orientation={userColor}
        movable={drill.isUserTurn ? userColor : "none"}
        onMove={drill.userMove}
        lastMove={drill.lastMove}
        arrows={drill.arrows}
        className="rounded-none sm:rounded-md"
      />
      <div className="space-y-3 px-3 sm:px-0">
        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {drill.ply}/{drill.total}
          </span>
        </div>
        <div
          role="status"
          className={cn(
            "min-h-11 rounded-lg border px-3 py-2 text-sm",
            drill.feedback
              ? FEEDBACK_STYLES[drill.feedback.kind]
              : "border-transparent",
          )}
        >
          {drill.feedback?.text ??
            (drill.finished
              ? ""
              : drill.isUserTurn
                ? `${userColor === "w" ? "백" : "흑"} 차례입니다. 수순대로 두어 보세요.`
                : "상대가 두는 중…")}
        </div>
        <div className="flex gap-2">
          {showHint && (
            <Button
              variant="secondary"
              onClick={drill.hint}
              disabled={!drill.isUserTurn}
            >
              <Lightbulb />
              힌트
            </Button>
          )}
          <Button variant="outline" onClick={drill.restart}>
            <RotateCcw />
            처음부터
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
