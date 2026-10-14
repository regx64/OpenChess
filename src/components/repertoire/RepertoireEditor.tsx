"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpToLine,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Trash2,
} from "lucide-react";
import Board, { type BoardMove } from "@/components/board/Board";
import { Button } from "@/components/ui/button";
import MoveList from "@/components/analysis/MoveList";
import ExplorerPanel from "@/components/analysis/ExplorerPanel";
import AnnotationBar from "@/components/analysis/AnnotationBar";
import OpeningBanner from "@/components/analysis/OpeningBanner";
import { useGameTree } from "@/hooks/useGameTree";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import { GameTree } from "@/lib/game/tree";
import { koreanName } from "@/lib/koName";
import { findGaps, repertoireStats } from "@/lib/repertoire";
import { repertoireStore, updateRepertoire } from "@/lib/repertoireStore";
import { playSound, soundForSan } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Tab = "moves" | "explorer" | "gaps";

/**
 * 레퍼토리 편집: 보드에서 수를 두면 트리에 쌓이고, 구멍(준비 안 된 상대 수)을 찾아 채웁니다.
 */
export default function RepertoireEditor({ docs }: { docs: DocRef[] }) {
  const list = repertoireStore.use();
  const [id, setId] = useState<string | null>(null);
  useEffect(
    () => setId(new URLSearchParams(window.location.search).get("id")),
    [],
  );
  const repertoire = list.find((item) => item.id === id);

  if (id === null) return null;
  if (!repertoire) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        레퍼토리를 찾을 수 없습니다.{" "}
        <Link href="/repertoire" className="text-primary underline">
          목록으로
        </Link>
      </p>
    );
  }
  return (
    <Editor
      key={repertoire.id}
      id={repertoire.id}
      initialPgn={repertoire.pgn}
      docs={docs}
    />
  );
}

function Editor({
  id,
  initialPgn,
  docs,
}: {
  id: string;
  initialPgn: string;
  docs: DocRef[];
}) {
  const repertoire = repertoireStore.use().find((item) => item.id === id)!;
  const [tree] = useState(() => {
    const t = new GameTree();
    if (initialPgn.trim()) t.loadPgn(initialPgn);
    t.toStart();
    return t;
  });
  const version = useGameTree(tree);
  const book = useOpeningBook();
  const [tab, setTab] = useState<Tab>("moves");
  const current = tree.current;
  const color = repertoire.color;

  // 바뀔 때마다 저장
  useEffect(() => {
    const timer = setTimeout(() => {
      const pgn = tree.toPgn();
      if (pgn !== repertoireStore.get().find((item) => item.id === id)?.pgn) {
        updateRepertoire(id, { pgn });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tree, version, id]);

  const gaps = useMemo(
    () => (book ? findGaps(tree, color, book) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [book, tree, version, color],
  );
  const stats = useMemo(
    () => repertoireStats(tree),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, version],
  );

  const play = (move: BoardMove | string) => {
    const node = tree.play(move);
    if (node) playSound(soundForSan(node.san));
  };

  // 키보드 이동
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") tree.back();
      else if (event.key === "ArrowRight") tree.forward();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tree]);

  const atStart = current === tree.root;
  const tabs: { id: Tab; label: string }[] = [
    { id: "moves", label: "수순" },
    { id: "explorer", label: "탐색기" },
    { id: "gaps", label: `구멍 ${gaps.length}` },
  ];

  return (
    <div className="analysis mx-auto flex w-full max-w-[1400px] flex-col gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-6 lg:px-6 lg:py-4">
      <section className="mx-auto w-[var(--board-size)] max-w-full shrink-0 lg:mx-0">
        <Board
          fen={current.fen}
          orientation={color}
          onMove={play}
          lastMove={atStart ? null : { from: current.from, to: current.to }}
          className="rounded-none sm:rounded-md"
        />
        <div className="mt-2 grid grid-cols-4 gap-1.5 px-2 sm:px-0">
          {[
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
              disabled: !current.children.length,
            },
            {
              label: "마지막으로",
              icon: ChevronLast,
              onClick: () => tree.toEnd(),
              disabled: !current.children.length,
            },
          ].map(({ label, icon: Icon, onClick, disabled }) => (
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

      <aside className="flex w-full min-w-0 flex-col gap-3 px-3 pb-4 sm:px-4 lg:h-[calc(var(--board-size)+3.25rem)] lg:w-[420px] lg:px-0 lg:pb-0">
        <div className="space-y-2 rounded-lg border bg-card p-3">
          <input
            aria-label="레퍼토리 이름"
            value={repertoire.name}
            onChange={(event) =>
              updateRepertoire(id, { name: event.target.value })
            }
            className="w-full rounded border-transparent bg-transparent text-lg font-bold hover:border-input focus:border-input focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{color === "w" ? "백" : "흑"} 레퍼토리</span>·
            <span>수순 {stats.lines}개</span>·
            <span>위치 {stats.positions}개</span>
            <Button size="sm" variant="secondary" className="ml-auto" asChild>
              <Link href={`/train/drill?repertoire=${id}`}>
                <Repeat />
                연습
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            보드에서 수를 두면 레퍼토리에 더해집니다.{" "}
            {color === "w" ? "백" : "흑"} 수는 내가 둘 수, 상대 수는 대비할
            응수입니다.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <OpeningBanner
            tree={tree}
            version={version}
            book={book}
            docs={docs}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="flex border-b" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex-1 border-b-2 px-3 py-2 text-sm font-medium",
                  tab === item.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "moves" && (
            <>
              <MoveList
                tree={tree}
                version={version}
                className="max-h-[45vh] min-h-24 flex-1 p-3 lg:max-h-none"
              />
              {!atStart && <AnnotationBar tree={tree} node={current} />}
              {!atStart && (
                <div className="flex flex-wrap gap-1 border-t p-2">
                  {!tree.isMainline(current) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => tree.promote(current)}
                    >
                      <ArrowUpToLine />주 수순으로
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => tree.remove(current)}
                  >
                    <Trash2 />이 수부터 삭제
                  </Button>
                </div>
              )}
            </>
          )}
          {tab === "explorer" && (
            <ExplorerPanel
              tree={tree}
              version={version}
              book={book}
              className="max-h-[50vh] min-h-24 flex-1 lg:max-h-none"
            />
          )}
          {tab === "gaps" && (
            <div className="max-h-[50vh] min-h-24 flex-1 overflow-y-auto p-3 lg:max-h-none">
              {gaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {stats.lines
                    ? "주요 이론 수순 안에서는 구멍이 없습니다. 잘 준비했어요!"
                    : "아직 수순이 없습니다. 보드에서 수를 두어 레퍼토리를 만들어 보세요."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {gaps.slice(0, 40).map((gap) => (
                    <li
                      key={`${gap.nodeId}-${gap.kind}`}
                      className="rounded-md border p-2 text-sm"
                    >
                      <button
                        type="button"
                        className="block w-full text-left font-mono text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const node = tree.find(gap.nodeId);
                          if (node) tree.goTo(node);
                        }}
                      >
                        {gap.line || "(시작 위치)"}
                      </button>
                      <p className="mt-1">
                        {gap.kind === "opponent"
                          ? "상대의 이 수들에 대한 준비가 없습니다:"
                          : "내 차례인데 둘 수를 정하지 않았습니다. 이론 후보:"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {gap.moves.map((move) => (
                          <button
                            key={move.san}
                            type="button"
                            title={
                              move.opening
                                ? koreanName(move.opening.name)
                                : undefined
                            }
                            onClick={() => {
                              const node = tree.find(gap.nodeId);
                              if (!node) return;
                              tree.goTo(node);
                              play(move.san);
                              setTab("moves");
                            }}
                            className="rounded border px-2 py-0.5 font-mono text-xs hover:bg-muted"
                          >
                            {move.san}
                            <span className="ml-1 text-muted-foreground">
                              {move.lines}
                            </span>
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
