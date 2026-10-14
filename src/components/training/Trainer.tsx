"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import OpeningSearch from "@/components/OpeningSearch";
import { Button } from "@/components/ui/button";
import { DrillBoard } from "@/components/training/DrillBoard";
import { useLineDrill, type DrillResult } from "@/hooks/useLineDrill";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import { findDocForName } from "@/lib/docsIndex";
import { koreanName } from "@/lib/koName";
import type { OpeningBook } from "@/lib/openingBook";
import { sansToPgn } from "@/lib/openingBook";
import { findBySlug, openingHref } from "@/lib/openingDetail";
import {
  buildSession,
  dueCards,
  lineForName,
  linesUnder,
  type TrainingLine,
} from "@/lib/training/lines";
import { cardKey, cardsStore, recordReview } from "@/lib/training/progress";
import { cardLevel, type Grade, LEVEL_LABELS, today } from "@/lib/training/srs";
import { cn, normalizeFileName } from "@/lib/utils";

type Color = "w" | "b";

interface Item {
  line: TrainingLine;
  color: Color;
  status: "due" | "new";
}

interface Config {
  /** 오프닝 주소 이름 (없으면 전체 복습) */
  slug: string | null;
  color: Color;
}

/** 수비 이름이면 흑, 아니면 백으로 연습하는 것이 자연스러움 */
const defaultColor = (name: string): Color =>
  /Defense|Defence|Countergambit/.test(name.split(":")[0]) ? "b" : "w";

const gradeOf = (result: DrillResult): Grade =>
  result.mistakes === 0 && result.hints === 0
    ? "good"
    : result.mistakes <= 1
      ? "hard"
      : "again";

const GRADE_TEXT: Record<Grade, string> = {
  good: "완벽합니다!",
  hard: "맞혔지만 조금 헤맸어요.",
  again: "다시 연습이 필요해요. 오늘 다시 나옵니다.",
};

function updateUrl(config: Config | null) {
  const params = new URLSearchParams();
  if (config?.slug) params.set("opening", config.slug);
  if (config) params.set("color", config.color);
  if (config && !config.slug) params.set("mode", "review");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    query ? `?${query}` : window.location.pathname,
  );
}

/**
 * 오프닝 트레이너: 오프닝과 색을 고르면, 상대 수는 자동으로 두고 내 수를 맞히는 연습.
 * 결과는 간격 반복 일정에 반영됩니다.
 */
export default function Trainer({ docs }: { docs: DocRef[] }) {
  const book = useOpeningBook();
  const [config, setConfig] = useState<Config | null>(null);
  const [session, setSession] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ item: Item; grade: Grade }[]>([]);

  // 주소의 ?opening=…&color=…&mode=review 로 바로 시작
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("opening");
    const color = params.get("color");
    if (slug || params.get("mode") === "review") {
      setConfig({ slug, color: color === "b" ? "b" : "w" });
    }
  }, []);

  const start = useCallback(
    (next: Config) => {
      if (!book) return;
      const cards = cardsStore.get();
      let items: Item[];
      if (next.slug) {
        const entry = findBySlug(book, next.slug);
        if (!entry) return;
        items = buildSession(linesUnder(book, entry), cards, next.color).map(
          (item) => ({
            ...item,
            color: next.color,
          }),
        );
      } else {
        items = dueCards(cards)
          .slice(0, 15)
          .flatMap(({ color, name }) => {
            const line = lineForName(book, name);
            return line ? [{ line, color, status: "due" as const }] : [];
          });
      }
      setConfig(next);
      setSession(items);
      setIndex(0);
      setResults([]);
      updateUrl(next);
    },
    [book],
  );

  // 주소로 들어왔으면 데이터를 불러온 뒤 시작
  useEffect(() => {
    if (book && config && !session) start(config);
  }, [book, config, session, start]);

  if (!book) {
    return (
      <p className="px-4 text-sm text-muted-foreground sm:px-0">
        오프닝 데이터를 불러오는 중…
      </p>
    );
  }

  if (!session || !config) {
    return <TrainerSetup book={book} docs={docs} onStart={start} />;
  }

  if (session.length === 0) {
    return (
      <div className="space-y-4 px-4 sm:px-0">
        <p>
          {config.slug
            ? "이 오프닝은 지금 복습할 수순이 없고 새로 배울 수순도 모두 연습했습니다. 내일 다시 오세요!"
            : "오늘 복습할 수순이 없습니다. 새 오프닝을 연습해 보세요."}
        </p>
        <Button
          onClick={() => {
            setSession(null);
            setConfig(null);
            updateUrl(null);
          }}
        >
          다른 오프닝 고르기
        </Button>
      </div>
    );
  }

  if (index >= session.length) {
    return (
      <SessionSummary
        results={results}
        onAgain={() => start(config)}
        onChange={() => {
          setSession(null);
          setConfig(null);
          updateUrl(null);
        }}
      />
    );
  }

  const item = session[index];
  return (
    <DrillItem
      key={`${index}-${item.color}-${item.line.name}`}
      book={book}
      docs={docs}
      item={item}
      position={`${index + 1} / ${session.length}`}
      onDone={(grade) => setResults((list) => [...list, { item, grade }])}
      onNext={() => setIndex((i) => i + 1)}
    />
  );
}

/** 수순 하나 연습 */
function DrillItem({
  book,
  docs,
  item,
  position,
  onDone,
  onNext,
}: {
  book: OpeningBook;
  docs: DocRef[];
  item: Item;
  position: string;
  onDone: (grade: Grade) => void;
  onNext: () => void;
}) {
  const [grade, setGrade] = useState<Grade | null>(null);
  // 같은 수순을 "한 번 더" 연습해도 복습 일정에는 첫 결과만 반영
  const [recorded, setRecorded] = useState(false);
  const { line, color } = item;

  const drill = useLineDrill({
    sans: line.sans,
    userColor: color,
    // 데이터셋의 다른 이론 수는 실수로 세지 않음
    judge: (ply, san, fen) =>
      san === line.sans[ply]
        ? "correct"
        : book.movesFrom(fen).some((move) => move.san === san)
          ? "alternative"
          : "wrong",
    onFinish: (result) => {
      const g = gradeOf(result);
      setGrade(g);
      if (!recorded) {
        setRecorded(true);
        recordReview(color, line.name, g);
        onDone(g);
      }
    },
  });

  const card = cardsStore.use()[cardKey(color, line.name)];
  const doc = findDocForName(docs, line.name);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      <DrillBoard drill={drill} userColor={color} />
      <div className="space-y-4 px-3 sm:px-0">
        <div className="text-xs text-muted-foreground">
          {position} · {item.status === "due" ? "복습" : "새 수순"} ·{" "}
          {color === "w" ? "백으로" : "흑으로"} 연습
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {line.eco} · {line.name}
          </p>
          <h2 className="text-xl font-bold">{koreanName(line.name)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {line.sans.length}수(반수)짜리 수순입니다. 상대 수는 자동으로
            둡니다.
          </p>
        </div>

        {grade && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <p className="flex items-center gap-2 font-semibold">
              {grade === "again" ? (
                <XCircle className="size-5 text-destructive" />
              ) : (
                <CheckCircle2 className="size-5 text-primary" />
              )}
              {GRADE_TEXT[grade]}
            </p>
            <p className="break-words font-mono text-sm">
              {sansToPgn(line.sans)}
            </p>
            {card && grade !== "again" && (
              <p className="text-sm text-muted-foreground">
                다음 복습:{" "}
                {card.due - today() <= 0
                  ? "오늘"
                  : `${card.due - today()}일 뒤`}{" "}
                · {LEVEL_LABELS[cardLevel(card)]}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={onNext}>다음 수순</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setGrade(null);
                  drill.restart();
                }}
              >
                <RefreshCw />한 번 더
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={openingHref(line.name)}
            className="text-primary hover:underline"
          >
            오프닝 페이지
          </Link>
          {doc && (
            <Link
              href={`/openings/${doc.slug}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <BookOpen className="size-3.5" />
              {doc.title} 해설
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionSummary({
  results,
  onAgain,
  onChange,
}: {
  results: { item: Item; grade: Grade }[];
  onAgain: () => void;
  onChange: () => void;
}) {
  const good = results.filter((r) => r.grade !== "again").length;
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 sm:px-0">
      <h2 className="text-2xl font-bold">연습 완료</h2>
      <p className="text-muted-foreground">
        {results.length}개 수순 중 {good}개를 맞혔습니다.
      </p>
      <ul className="divide-y rounded-lg border">
        {results.map(({ item, grade }, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 p-3 text-sm"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {koreanName(item.line.name)}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.color === "w" ? "백" : "흑"} · {item.line.eco}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded px-2 py-0.5 text-xs",
                grade === "again"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-primary/15 text-primary",
              )}
            >
              {grade === "good" ? "완벽" : grade === "hard" ? "헤맴" : "다시"}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button onClick={onAgain}>이어서 연습</Button>
        <Button variant="outline" onClick={onChange}>
          다른 오프닝
        </Button>
      </div>
    </div>
  );
}

/** 오프닝·색 고르기 */
function TrainerSetup({
  book,
  docs,
  onStart,
}: {
  book: OpeningBook;
  docs: DocRef[];
  onStart: (config: Config) => void;
}) {
  const cards = cardsStore.use();
  const [chosen, setChosen] = useState<string | null>(null);
  const [color, setColor] = useState<Color>("w");
  const due = useMemo(() => dueCards(cards), [cards]);
  const entry = chosen ? findBySlug(book, normalizeFileName(chosen)) : null;

  const stats = useMemo(() => {
    if (!entry) return null;
    const lines = linesUnder(book, entry);
    const levels = { new: 0, learning: 0, known: 0, mastered: 0 };
    let dueCount = 0;
    for (const line of lines) {
      const card = cards[cardKey(color, line.name)];
      levels[cardLevel(card)]++;
      if (card && card.seen > 0 && card.due <= today()) dueCount++;
    }
    return { total: lines.length, levels, dueCount };
  }, [book, entry, cards, color]);

  const choose = (name: string) => {
    setChosen(name);
    setColor(defaultColor(name));
  };

  return (
    <div className="space-y-8 px-4 sm:px-0">
      {due.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4">
          <div>
            <p className="font-semibold">오늘 복습할 수순 {due.length}개</p>
            <p className="text-sm text-muted-foreground">
              잊기 전에 복습하면 오래 기억에 남습니다.
            </p>
          </div>
          <Button onClick={() => onStart({ slug: null, color: "w" })}>
            복습 시작
          </Button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. 연습할 오프닝</h2>
        <OpeningSearch docs={docs} onSelect={(result) => choose(result.name)} />
        <div className="flex flex-wrap gap-2">
          {docs.slice(0, 41).map((doc) => (
            <button
              key={doc.slug}
              type="button"
              onClick={() => choose(doc.name)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm hover:bg-muted",
                chosen === doc.name && "border-primary bg-primary/10",
              )}
            >
              {doc.title}
            </button>
          ))}
        </div>
      </section>

      {entry && stats && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. 내가 둘 색</h2>
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
                  "rounded px-4 py-1.5 text-sm font-medium",
                  color === side
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {side === "w" ? "백" : "흑"}
              </button>
            ))}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold">{koreanName(entry.name)}</p>
            <p className="text-xs text-muted-foreground">
              {entry.eco} · {entry.pgn}
            </p>
            <p className="mt-2 text-sm">
              이 오프닝 아래 수순 {stats.total}개 ·{" "}
              {(["new", "learning", "known", "mastered"] as const)
                .map((level) => `${LEVEL_LABELS[level]} ${stats.levels[level]}`)
                .join(" · ")}
              {stats.dueCount > 0 && ` · 오늘 복습 ${stats.dueCount}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  onStart({ slug: normalizeFileName(entry.name), color })
                }
              >
                연습 시작 (최대 10개)
              </Button>
              <Button variant="outline" asChild>
                <Link href={openingHref(entry.name)}>오프닝 보기</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
