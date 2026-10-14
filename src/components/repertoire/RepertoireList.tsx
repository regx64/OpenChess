"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileUp, Pencil, Repeat, Trash2 } from "lucide-react";
import OpeningSearch from "@/components/OpeningSearch";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/components/analysis/ShareDialog";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import { koreanName } from "@/lib/koName";
import { findGaps, repertoireStats, treeOf } from "@/lib/repertoire";
import {
  createRepertoire,
  deleteRepertoire,
  repertoireStore,
} from "@/lib/repertoireStore";
import { parsePgn } from "@/lib/game/tree";
import { cn } from "@/lib/utils";

/** 분석 보드가 저장해 둔 마지막 분석 */
function analysisPgn(): string {
  try {
    return (
      JSON.parse(window.localStorage.getItem("openchess:analysis") ?? "null")
        ?.pgn ?? ""
    );
  } catch {
    return "";
  }
}

/**
 * 내 레퍼토리 목록: 만들기(빈 것 / 오프닝에서 / 분석 보드에서 / PGN 불러오기), 편집, 연습, 내보내기
 */
export default function RepertoireList({ docs }: { docs: DocRef[] }) {
  const list = repertoireStore.use();
  const book = useOpeningBook();
  const [name, setName] = useState("");
  const [color, setColor] = useState<"w" | "b">("w");
  const [seed, setSeed] = useState<{ label: string; pgn: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summaries = useMemo(
    () =>
      list.map((item) => {
        const tree = treeOf(item);
        return {
          item,
          stats: repertoireStats(tree),
          gaps: book ? findGaps(tree, item.color, book).length : null,
        };
      }),
    [list, book],
  );

  const create = () => {
    const repertoire = createRepertoire(name, color, seed?.pgn ?? "");
    window.location.href = `/repertoire/edit?id=${repertoire.id}`;
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    try {
      parsePgn(text);
    } catch {
      setError("PGN을 읽지 못했습니다.");
      return;
    }
    setError(null);
    setSeed({ label: file.name, pgn: text });
    if (!name) setName(file.name.replace(/\.pgn$/i, ""));
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold">새 레퍼토리</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 space-y-1">
            <span className="block text-xs font-medium text-muted-foreground">
              이름
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 백 1. e4 / 흑 vs 1. d4"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </label>
          <div className="space-y-1">
            <span className="block text-xs font-medium text-muted-foreground">
              내 색
            </span>
            <div
              className="inline-grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
              role="radiogroup"
            >
              {(["w", "b"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  role="radio"
                  aria-checked={color === side}
                  onClick={() => setColor(side)}
                  className={cn(
                    "rounded px-4 py-1 text-sm font-medium",
                    color === side
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {side === "w" ? "백" : "흑"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-muted-foreground">
            시작 수순 (선택)
          </span>
          <OpeningSearch
            docs={docs}
            placeholder="오프닝에서 시작하기 (예: 이탈리안, 카로칸)"
            onSelect={(result) => {
              setSeed({ label: koreanName(result.name), pgn: result.pgn });
              if (!name) setName(koreanName(result.name));
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const pgn = analysisPgn();
                if (pgn) setSeed({ label: "분석 보드의 수순", pgn });
                else setError("분석 보드에 저장된 수순이 없습니다.");
              }}
            >
              분석 보드에서 가져오기
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <FileUp />
                PGN 파일
                <input
                  type="file"
                  accept=".pgn,.txt"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importFile(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </Button>
            {seed && (
              <span className="self-center text-sm">
                시작: <span className="font-medium">{seed.label}</span>{" "}
                <button
                  type="button"
                  className="text-muted-foreground underline"
                  onClick={() => setSeed(null)}
                >
                  취소
                </button>
              </span>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button onClick={create}>만들고 편집하기</Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          내 레퍼토리 {list.length > 0 && `(${list.length})`}
        </h2>
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">
            아직 레퍼토리가 없습니다. 백으로 둘 오프닝, 흑으로 1. e4와 1. d4에
            대응할 오프닝을 하나씩 만들어 보세요. 어떤 오프닝을 고를지
            모르겠다면{" "}
            <Link href="/recommend" className="text-primary hover:underline">
              오프닝 추천
            </Link>
            을 받아 보세요.
          </p>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {summaries.map(({ item, stats, gaps }) => (
            <li key={item.id} className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.color === "w" ? "백" : "흑"} · 수순 {stats.lines}개 ·
                  위치 {stats.positions}개
                  {gaps !== null && (
                    <>
                      {" · "}
                      <span
                        className={
                          gaps
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-primary"
                        }
                      >
                        {gaps ? `구멍 ${gaps}곳` : "구멍 없음"}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.updated).toLocaleDateString("ko-KR")} 수정
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`/repertoire/edit?id=${item.id}`}>
                    <Pencil />
                    편집
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  asChild
                  disabled={!stats.lines}
                >
                  <Link href={`/train/drill?repertoire=${item.id}`}>
                    <Repeat />
                    연습
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadText(
                      `${item.name}.pgn`,
                      treeOf(item).toPgn({
                        headers: {
                          Event: `OpenChess 레퍼토리: ${item.name}`,
                          White: item.color === "w" ? "나" : "?",
                          Black: item.color === "b" ? "나" : "?",
                          Result: "*",
                        },
                      }) + "\n",
                      "application/x-chess-pgn",
                    )
                  }
                >
                  <Download />
                  PGN
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => {
                    if (window.confirm(`'${item.name}' 레퍼토리를 삭제할까요?`))
                      deleteRepertoire(item.id);
                  }}
                >
                  <Trash2 />
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
