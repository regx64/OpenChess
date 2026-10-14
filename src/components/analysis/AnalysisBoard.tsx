"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Trash2,
  ArrowUpToLine,
} from "lucide-react";
import Board, { type BoardMove } from "@/components/board/Board";
import type { Color } from "@/components/board/geometry";
import { Button } from "@/components/ui/button";
import OpeningSearch from "@/components/OpeningSearch";
import { useGameTree } from "@/hooks/useGameTree";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import { GameTree } from "@/lib/game/tree";
import { describeEnd, positionStatus } from "@/lib/game/status";
import { playSound, soundForSan } from "@/lib/sound";
import { createPersistentStore } from "@/lib/storage";
import type { DocRef } from "@/lib/docsIndex";
import { cn } from "@/lib/utils";
import MoveList from "./MoveList";
import OpeningBanner from "./OpeningBanner";
import ImportDialog from "./ImportDialog";
import ShareDialog from "./ShareDialog";

interface SavedAnalysis {
  pgn: string;
  /** 루트에서 현재 위치까지의 수 (SAN) */
  path: string[];
  orientation: Color;
}

/** 마지막으로 보던 분석을 새로고침해도 이어서 볼 수 있도록 저장 */
const analysisStore = createPersistentStore<SavedAnalysis | null>(
  "analysis",
  null,
);

/** 입력창에 글을 쓰는 중이면 단축키를 무시 */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

interface AnalysisBoardProps {
  docs: DocRef[];
}

/**
 * 메인 분석 보드: 보드 + 이동 버튼 + 오프닝 정보 + 수순 목록
 */
const AnalysisBoard: React.FC<AnalysisBoardProps> = ({ docs }) => {
  const [tree] = useState(() => new GameTree());
  const version = useGameTree(tree);
  const book = useOpeningBook();
  const [orientation, setOrientation] = useState<Color>("w");
  const [restored, setRestored] = useState(false);
  const current = tree.current;

  // 주소의 ?pgn= / ?fen= (문서의 "보드에서 보기", 공유 링크) 또는 저장된 분석 불러오기
  // (개발 모드에서 effect가 두 번 실행돼도 한 번만 불러오도록 ref로 막음)
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const params = new URLSearchParams(window.location.search);
    const pgn = params.get("pgn");
    const fen = params.get("fen");
    if (pgn !== null || fen !== null) {
      if (pgn !== null) tree.loadPgn(pgn);
      else if (fen !== null) tree.loadFen(fen);
      // 이후 수정한 내용이 새로고침 때 주소 값으로 덮어써지지 않도록 주소에서 제거
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      const saved = analysisStore.get();
      if (saved && tree.loadPgn(saved.pgn)) {
        tree.toStart();
        for (const san of saved.path) {
          const next = tree.current.children.find((child) => child.san === san);
          if (!next) break;
          tree.goTo(next);
        }
        setOrientation(saved.orientation);
      }
    }
    setRestored(true);
  }, [tree]);

  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => {
      analysisStore.set({
        pgn: tree.toPgn(),
        path: tree.pathTo().map((node) => node.san),
        orientation,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [tree, version, orientation, restored]);

  // 한 수 앞으로 갈 때(직접 두거나 다음 버튼) 효과음
  const previous = useRef(current);
  useEffect(() => {
    if (current.parent && current.parent === previous.current) {
      playSound(soundForSan(current.san));
    }
    previous.current = current;
  }, [current]);

  const status = useMemo(
    () => positionStatus(current.fen, tree.fensTo(current)),
    // version이 바뀌면 경로가 바뀌었을 수 있음
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, version, tree],
  );

  const handleMove = useCallback(
    (move: BoardMove) => {
      tree.play(move);
    },
    [tree],
  );

  const flip = useCallback(
    () => setOrientation((side) => (side === "w" ? "b" : "w")),
    [],
  );

  // 키보드: ←/→ 한 수, ↑/Home 처음, ↓/End 끝, F 뒤집기
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        isTyping(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => tree.back(),
        ArrowRight: () => tree.forward(),
        ArrowUp: () => tree.toStart(),
        Home: () => tree.toStart(),
        ArrowDown: () => tree.toEnd(),
        End: () => tree.toEnd(),
        f: flip,
        F: flip,
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tree, flip]);

  // 모바일: 수순 영역을 좌우로 밀면 한 수씩 이동
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeHandlers = {
    onTouchStart: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
        if (dx < 0) tree.forward();
        else tree.back();
      }
    },
  };

  const atStart = current === tree.root;
  const atEnd = current.children.length === 0;

  const navButtons = [
    {
      label: "처음으로",
      icon: ChevronFirst,
      onClick: () => tree.toStart(),
      disabled: atStart,
    },
    {
      label: "이전 수",
      icon: ChevronLeft,
      onClick: () => tree.back(),
      disabled: atStart,
    },
    {
      label: "다음 수",
      icon: ChevronRight,
      onClick: () => tree.forward(),
      disabled: atEnd,
    },
    {
      label: "마지막으로",
      icon: ChevronLast,
      onClick: () => tree.toEnd(),
      disabled: atEnd,
    },
    { label: "보드 뒤집기", icon: ArrowUpDown, onClick: flip, disabled: false },
  ];

  return (
    <div className="analysis mx-auto flex w-full max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-6 lg:px-6 lg:py-4">
      {/* 보드와 이동 버튼 */}
      <section className="mx-auto w-[var(--board-size)] max-w-full shrink-0 lg:mx-0">
        <Board
          fen={current.fen}
          orientation={orientation}
          onMove={handleMove}
          lastMove={atStart ? null : { from: current.from, to: current.to }}
          className="rounded-none sm:rounded-md"
        />
        <div className="mt-2 grid grid-cols-5 gap-1.5 px-2 sm:px-0">
          {navButtons.map(({ label, icon: Icon, onClick, disabled }) => (
            <Button
              key={label}
              variant="secondary"
              className="h-11 [&_svg]:size-5"
              aria-label={label}
              title={label}
              onClick={onClick}
              disabled={disabled}
            >
              <Icon />
            </Button>
          ))}
        </div>
      </section>

      {/* 오프닝 정보와 수순 */}
      <aside
        className="flex w-full min-w-0 flex-col gap-3 px-3 pb-4 sm:px-4 lg:h-[calc(var(--board-size)+3.25rem)] lg:w-[400px] lg:px-0 lg:pb-0"
        {...swipeHandlers}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <OpeningSearch onSelect={(pgn) => tree.loadPgn(pgn)} />
          </div>
          <ImportDialog tree={tree} />
          <ShareDialog tree={tree} version={version} />
          <Button
            variant="outline"
            size="icon"
            title="새로 시작"
            aria-label="새로 시작"
            onClick={() => tree.reset()}
          >
            <RotateCcw />
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <OpeningBanner
            tree={tree}
            version={version}
            book={book}
            docs={docs}
          />
        </div>

        {status.end && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold">
            {describeEnd(status.end)}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-card">
          <MoveList
            tree={tree}
            version={version}
            className="max-h-[45vh] min-h-24 flex-1 p-3 lg:max-h-none"
          />
          {!atStart && (
            <div className="flex flex-wrap gap-1 border-t p-2">
              {!tree.isMainline(current) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => tree.promote(current)}
                >
                  <ArrowUpToLine />
                  본선으로 올리기
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn("text-muted-foreground")}
                onClick={() => tree.remove(current)}
              >
                <Trash2 />이 수부터 삭제
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AnalysisBoard;
