"use client";

import React from "react";
import Link from "next/link";
import type { OpeningBook } from "@/lib/openingBook";
import type { GameTree } from "@/lib/game/tree";
import { koreanName } from "@/lib/koName";
import { openingHref } from "@/lib/openingDetail";
import { cn } from "@/lib/utils";

interface ExplorerPanelProps {
  tree: GameTree;
  version: number;
  book: OpeningBook | null;
  /** 줄 위에 마우스를 올리면 그 수를 보드에 강조 */
  onHover?: (san: string | null) => void;
  className?: string;
}

/**
 * 오프닝 탐색기: 지금 위치에서 데이터셋에 있는 다음 수와, 그 수를 두면 어떤 오프닝이 되는지 보여 줍니다.
 * 막대 길이는 그 수 아래에 이어지는 이름 붙은 수순의 수(이론의 두께)입니다.
 */
const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  tree,
  book,
  onHover,
  className,
}) => {
  const current = tree.current;
  if (!book) {
    return (
      <p className={cn("p-3 text-sm text-muted-foreground", className)}>
        오프닝 데이터를 불러오는 중…
      </p>
    );
  }

  const moves = book.movesFrom(current.fen);
  const max = Math.max(1, ...moves.map((move) => move.lines));
  const nextColor = current.fen.split(" ")[1];
  const moveNumber = Number(current.fen.split(" ")[5]) || 1;
  const prefix = nextColor === "w" ? `${moveNumber}.` : `${moveNumber}...`;

  if (moves.length === 0) {
    return (
      <div
        className={cn("space-y-2 p-3 text-sm text-muted-foreground", className)}
      >
        <p>데이터셋에 이 위치 다음 수가 없습니다.</p>
        <p>
          이론 수순을 벗어났거나 오프닝이 끝난 위치입니다. 이전 수로 돌아가면
          다른 갈래를 볼 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-y-auto", className)}>
      <div className="sticky top-0 z-10 grid grid-cols-[4.5rem_1fr_auto] gap-2 border-b bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span>다음 수</span>
        <span>이어지는 오프닝</span>
        <span title="이 수 아래에 있는 이름 붙은 수순 수">수순</span>
      </div>
      <ul>
        {moves.map((move) => {
          const opening = move.opening;
          return (
            <li key={move.san}>
              <button
                type="button"
                className="grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                onClick={() => tree.play(move.san)}
                onPointerEnter={() => onHover?.(move.san)}
                onPointerLeave={() => onHover?.(null)}
              >
                <span className="font-mono text-sm font-semibold">
                  <span className="mr-0.5 text-xs font-normal text-muted-foreground">
                    {prefix}
                  </span>
                  {move.san}
                </span>
                <span className="min-w-0">
                  {opening ? (
                    <>
                      <span className="block truncate text-sm">
                        {koreanName(opening.name)}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {opening.eco} · {opening.name}
                      </span>
                    </>
                  ) : (
                    <span className="block text-xs text-muted-foreground">
                      이름 없는 중간 수순
                    </span>
                  )}
                  <span className="mt-1 block h-1 rounded-full bg-muted">
                    <span
                      className="block h-1 rounded-full bg-primary/70"
                      style={{
                        width: `${Math.max(4, (move.lines / max) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
                <span className="text-right font-mono text-xs text-muted-foreground">
                  {move.lines}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {book.openingAt(current.fen) && (
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          지금 위치:{" "}
          <Link
            href={openingHref(book.openingAt(current.fen)!.name)}
            className="text-primary hover:underline"
          >
            {koreanName(book.openingAt(current.fen)!.name)}
          </Link>
        </p>
      )}
    </div>
  );
};

export default ExplorerPanel;
