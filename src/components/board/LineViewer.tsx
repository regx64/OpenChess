"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
} from "lucide-react";
import Board from "@/components/board/Board";
import type { Color } from "@/components/board/geometry";
import { Button } from "@/components/ui/button";
import { parsePgn, type MoveNode } from "@/lib/game/tree";
import { playSound, soundForSan } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { INITIAL_FEN } from "@/types/chess";

export interface LineViewerProps {
  /** 보여 줄 수순 (PGN) */
  pgn: string;
  /** 처음 보여 줄 수 (0 = 시작 위치, 기본: 마지막 수) */
  initialPly?: number;
  orientation?: Color;
  /** 수순 목록 표시 */
  showMoves?: boolean;
  /** "분석 보드에서 열기" 링크 표시 */
  showOpenLink?: boolean;
  /** 위치가 바뀔 때 (몇 번째 수인지) */
  onPlyChange?: (ply: number) => void;
  /** 밖에서 위치를 정하고 싶을 때 */
  ply?: number;
  className?: string;
  /** 보드 위에 덧붙일 내용 (예: 제목) */
  header?: React.ReactNode;
}

/**
 * 정해진 수순을 한 수씩 넘겨 보는 보기 전용 보드
 */
export default function LineViewer({
  pgn,
  initialPly,
  orientation: initialOrientation = "w",
  showMoves = true,
  showOpenLink = true,
  onPlyChange,
  ply: controlledPly,
  className,
  header,
}: LineViewerProps) {
  const { moves, startFen } = useMemo(() => {
    try {
      const tree = parsePgn(pgn);
      return { moves: tree.mainlineFrom(), startFen: tree.root.fen };
    } catch {
      return { moves: [] as MoveNode[], startFen: undefined };
    }
  }, [pgn]);

  const [innerPly, setInnerPly] = useState(initialPly ?? moves.length);
  const [orientation, setOrientation] = useState<Color>(initialOrientation);
  const [playing, setPlaying] = useState(false);
  const ply = Math.min(controlledPly ?? innerPly, moves.length);

  // 수순이 바뀌거나 밖에서 위치 지정을 풀면 처음 정한 위치로
  useEffect(() => {
    if (controlledPly !== undefined) return;
    setInnerPly(initialPly ?? moves.length);
    setPlaying(false);
  }, [moves, initialPly, controlledPly]);

  useEffect(() => setOrientation(initialOrientation), [initialOrientation]);

  const go = (next: number, sound = false) => {
    const clamped = Math.max(0, Math.min(moves.length, next));
    if (clamped === ply) return;
    if (sound && clamped === ply + 1)
      playSound(soundForSan(moves[clamped - 1].san));
    setInnerPly(clamped);
    onPlyChange?.(clamped);
  };

  // 자동 재생
  useEffect(() => {
    if (!playing) return;
    if (ply >= moves.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => go(ply + 1, true), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ply, moves.length]);

  const current = ply > 0 ? moves[ply - 1] : null;
  const fen = current?.fen ?? startFen;
  if (!fen) {
    return (
      <p className="text-sm text-destructive">수순을 읽지 못했습니다: {pgn}</p>
    );
  }

  const controls = [
    {
      label: "처음으로",
      icon: ChevronFirst,
      onClick: () => go(0),
      disabled: ply === 0,
    },
    {
      label: "이전 수",
      icon: ChevronLeft,
      onClick: () => go(ply - 1),
      disabled: ply === 0,
    },
    {
      label: playing ? "멈춤" : "자동 재생",
      icon: playing ? Pause : Play,
      onClick: () => {
        if (!playing && ply >= moves.length) go(0);
        setPlaying(!playing);
      },
      disabled: moves.length === 0,
    },
    {
      label: "다음 수",
      icon: ChevronRight,
      onClick: () => go(ply + 1, true),
      disabled: ply >= moves.length,
    },
    {
      label: "마지막으로",
      icon: ChevronLast,
      onClick: () => go(moves.length),
      disabled: ply >= moves.length,
    },
    {
      label: "보드 뒤집기",
      icon: ArrowUpDown,
      onClick: () => setOrientation((side) => (side === "w" ? "b" : "w")),
      disabled: false,
    },
  ];

  return (
    <div
      className={cn("flex flex-col gap-2 outline-none", className)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(ply - 1);
        else if (event.key === "ArrowRight") go(ply + 1, true);
        else return;
        event.preventDefault();
      }}
    >
      {header}
      <Board
        fen={fen}
        orientation={orientation}
        movable="none"
        lastMove={current ? { from: current.from, to: current.to } : null}
      />
      <div className="grid grid-cols-6 gap-1">
        {controls.map(({ label, icon: Icon, onClick, disabled }) => (
          <Button
            key={label}
            variant="secondary"
            size="sm"
            className="h-9 [&_svg]:size-4"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon />
          </Button>
        ))}
      </div>
      {showMoves && moves.length > 0 && (
        <div className="flex flex-wrap gap-x-0.5 font-mono text-sm leading-7">
          {moves.map((move, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i + 1)}
              className={cn(
                "rounded px-1 hover:bg-muted",
                i + 1 === ply &&
                  "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {move.color === "w" || i === 0
                ? `${move.moveNumber}${move.color === "w" ? "." : "..."} `
                : ""}
              {move.san}
            </button>
          ))}
        </div>
      )}
      {showOpenLink && (
        <Link
          href={
            startFen === INITIAL_FEN
              ? `/?pgn=${encodeURIComponent(movesTo(moves, ply))}`
              : `/?fen=${encodeURIComponent(fen)}`
          }
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          분석 보드에서 이어서 두기
        </Link>
      )}
    </div>
  );
}

/** 처음부터 ply번째 수까지의 수순 */
function movesTo(moves: MoveNode[], ply: number): string {
  return moves
    .slice(0, ply)
    .map((move, i) =>
      move.color === "w"
        ? `${move.moveNumber}. ${move.san}`
        : i === 0
          ? `${move.moveNumber}... ${move.san}`
          : move.san,
    )
    .join(" ");
}
