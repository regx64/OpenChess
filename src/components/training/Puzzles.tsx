"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import LineViewer from "@/components/board/LineViewer";
import { DrillBoard } from "@/components/training/DrillBoard";
import { Button } from "@/components/ui/button";
import { useLineDrill, type Verdict } from "@/hooks/useLineDrill";
import { koreanName } from "@/lib/koName";
import { openingHref } from "@/lib/openingDetail";
import {
  puzzleStore,
  recordActivity,
  updatePuzzleRating,
} from "@/lib/training/progress";
import { cn } from "@/lib/utils";

/** public/data/puzzles.json 한 줄: [id, fen, 수(UCI), 레이팅, 테마, 오프닝 이름] */
type RawPuzzle = [string, string, string, number, string, string];

interface Puzzle {
  id: string;
  fen: string;
  /** 첫 수(상대)를 포함한 SAN 수순 */
  sans: string[];
  rating: number;
  themes: string[];
  opening: string;
  family: string;
}

/** 자주 나오는 테마의 한국어 이름 */
export const THEME_LABELS: Record<string, string> = {
  mate: "메이트",
  mateIn1: "1수 메이트",
  mateIn2: "2수 메이트",
  mateIn3: "3수 메이트",
  fork: "포크",
  pin: "핀",
  skewer: "스큐어",
  discoveredAttack: "디스커버드 어택",
  doubleCheck: "더블 체크",
  sacrifice: "희생",
  hangingPiece: "공짜 기물",
  trappedPiece: "갇힌 기물",
  kingsideAttack: "킹사이드 공격",
  attackingF2F7: "f2·f7 공격",
  deflection: "유인 제거",
  attraction: "끌어들이기",
  intermezzo: "중간수",
  defensiveMove: "방어",
  opening: "오프닝 단계",
  middlegame: "중반",
  short: "짧은 수순",
  long: "긴 수순",
};

const FILTER_THEMES = [
  "mate",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "sacrifice",
  "hangingPiece",
  "trappedPiece",
  "kingsideAttack",
  "attackingF2F7",
  "opening",
];

let cache: Promise<Puzzle[]> | null = null;

function loadPuzzles(): Promise<Puzzle[]> {
  cache ??= fetch("/data/puzzles.json")
    .then((response) => response.json())
    .then((raw: RawPuzzle[]) =>
      raw.flatMap(([id, fen, moves, rating, themes, opening]) => {
        try {
          const chess = new Chess(fen);
          const sans = moves
            .split(" ")
            .map(
              (uci) =>
                chess.move({
                  from: uci.slice(0, 2),
                  to: uci.slice(2, 4),
                  promotion: uci[4],
                }).san,
            );
          return [
            {
              id,
              fen,
              sans,
              rating,
              themes: themes.split(" "),
              opening,
              family: opening.split(":")[0],
            },
          ];
        } catch {
          return [];
        }
      }),
    );
  return cache;
}

/** 이 수가 체크메이트인지 */
const isMate = (fen: string, san: string) => {
  try {
    const chess = new Chess(fen);
    chess.move(san);
    return chess.isCheckmate();
  } catch {
    return false;
  }
};

/**
 * 오프닝별 실전 퍼즐 (Lichess 퍼즐 데이터베이스, CC0)
 */
export default function Puzzles() {
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const stats = puzzleStore.use();
  const [family, setFamily] = useState("");
  const [theme, setTheme] = useState("");
  const [current, setCurrent] = useState<Puzzle | null>(null);

  useEffect(() => {
    loadPuzzles()
      .then(setPuzzles)
      .catch(() => setPuzzles([]));
    const params = new URLSearchParams(window.location.search);
    setFamily(params.get("opening") ?? "");
  }, []);

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const puzzle of puzzles ?? [])
      counts.set(puzzle.family, (counts.get(puzzle.family) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [puzzles]);

  const pool = useMemo(
    () =>
      (puzzles ?? []).filter(
        (puzzle) =>
          (!family || puzzle.family === family || puzzle.opening === family) &&
          (!theme || puzzle.themes.includes(theme)),
      ),
    [puzzles, family, theme],
  );

  /** 내 레이팅에 가까운, 아직 안 푼 퍼즐 중 하나 */
  const next = useCallback(() => {
    if (!pool.length) {
      setCurrent(null);
      return;
    }
    const { rating, done } = puzzleStore.get();
    const fresh = pool.filter((puzzle) => !done.includes(puzzle.id));
    const from = (fresh.length ? fresh : pool)
      .slice()
      .sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating))
      .slice(0, 25);
    setCurrent(from[Math.floor(Math.random() * from.length)]);
  }, [pool]);

  useEffect(next, [next]);

  if (!puzzles)
    return <p className="text-sm text-muted-foreground">퍼즐을 불러오는 중…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 px-4 sm:px-0">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">
            오프닝
          </span>
          <select
            value={family}
            onChange={(event) => setFamily(event.target.value)}
            className="h-9 max-w-[16rem] rounded-md border bg-background px-2 text-sm"
          >
            <option value="">전체 ({puzzles.length})</option>
            {families.map(([name, count]) => (
              <option key={name} value={name}>
                {koreanName(name)} ({count})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">
            전술
          </span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">전체</option>
            {FILTER_THEMES.map((id) => (
              <option key={id} value={id}>
                {THEME_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto text-right text-sm">
          <div>
            내 퍼즐 레이팅 <span className="font-semibold">{stats.rating}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.solved}/{stats.attempts} 성공 · 조건에 맞는 퍼즐{" "}
            {pool.length}개
          </div>
        </div>
      </div>

      {current ? (
        <PuzzleBoard key={current.id} puzzle={current} onNext={next} />
      ) : (
        <p className="text-sm text-muted-foreground">
          조건에 맞는 퍼즐이 없습니다.
        </p>
      )}
    </div>
  );
}

function PuzzleBoard({
  puzzle,
  onNext,
}: {
  puzzle: Puzzle;
  onNext: () => void;
}) {
  // 첫 수는 상대가 두므로, 사용자는 FEN의 차례와 반대 색
  const userColor = (puzzle.fen.split(" ")[1] === "w" ? "b" : "w") as "w" | "b";
  const [result, setResult] = useState<{
    success: boolean;
    delta: number;
  } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const lastUserPly =
    puzzle.sans.length % 2 === 0
      ? puzzle.sans.length - 1
      : puzzle.sans.length - 2;

  const drill = useLineDrill({
    sans: puzzle.sans,
    startFen: puzzle.fen,
    userColor,
    autoDelay: 600,
    judge: (ply, san, fen): Verdict =>
      san === puzzle.sans[ply]
        ? "correct"
        : // 마지막 수는 다른 메이트 수도 정답
          ply === lastUserPly && isMate(fen, san)
          ? "finish"
          : "fail",
    describe: (verdict) =>
      verdict === "correct"
        ? "좋습니다! 계속하세요."
        : verdict === "fail"
          ? "틀렸습니다."
          : null,
    onFinish: (finish) => {
      const success = finish.success && finish.hints === 0;
      const before = puzzleStore.get().rating;
      const after = updatePuzzleRating(before, puzzle.rating, success);
      puzzleStore.set((s) => ({
        rating: after,
        solved: s.solved + (success ? 1 : 0),
        attempts: s.attempts + 1,
        done: s.done.includes(puzzle.id) ? s.done : [...s.done, puzzle.id],
        byOpening: {
          ...s.byOpening,
          [puzzle.family]: [
            (s.byOpening[puzzle.family]?.[0] ?? 0) + (success ? 1 : 0),
            (s.byOpening[puzzle.family]?.[1] ?? 0) + 1,
          ],
        },
      }));
      recordActivity("puzzles");
      setResult({ success, delta: after - before });
      if (finish.success && !success) {
        drill.setFeedback({
          kind: "warning",
          text: "끝까지 풀었지만 힌트를 봐서 실패로 기록됩니다.",
        });
      }
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      {showSolution ? (
        <LineViewer
          pgn={`[FEN "${puzzle.fen}"]\n${toPgn(puzzle)}`}
          orientation={userColor}
          initialPly={1}
        />
      ) : (
        <DrillBoard drill={drill} userColor={userColor} />
      )}
      <div className="space-y-4 px-3 sm:px-0">
        <div>
          <p className="text-sm text-muted-foreground">
            {userColor === "w" ? "백" : "흑"} 차례 · 레이팅 {puzzle.rating}
          </p>
          <p className="text-lg font-semibold">최선의 수를 찾으세요</p>
          <Link
            href={openingHref(puzzle.opening)}
            className="text-sm text-primary hover:underline"
          >
            {koreanName(puzzle.opening)}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1">
            {result &&
              puzzle.themes
                .filter((t) => THEME_LABELS[t])
                .map((t) => (
                  <span
                    key={t}
                    className="rounded bg-muted px-2 py-0.5 text-xs"
                  >
                    {THEME_LABELS[t]}
                  </span>
                ))}
          </div>
        </div>

        {result && (
          <div
            className={cn(
              "space-y-3 rounded-lg border p-4",
              result.success
                ? "border-primary/50 bg-primary/10"
                : "border-destructive/50 bg-destructive/10",
            )}
          >
            <p className="flex items-center gap-2 font-semibold">
              {result.success ? (
                <CheckCircle2 className="size-5 text-primary" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
              {result.success ? "성공!" : "실패"}
              <span className="font-mono text-sm font-normal">
                ({result.delta >= 0 ? "+" : ""}
                {result.delta})
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onNext}>다음 퍼즐</Button>
              {!showSolution && (
                <Button variant="outline" onClick={() => setShowSolution(true)}>
                  풀이 보기
                </Button>
              )}
              <Button variant="ghost" asChild>
                <a
                  href={`https://lichess.org/training/${puzzle.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink />
                  Lichess에서 보기
                </a>
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          퍼즐 출처: Lichess 퍼즐 데이터베이스 (CC0). 힌트를 보면 실패로
          기록됩니다.
        </p>
      </div>
    </div>
  );
}

/** 퍼즐 수순을 PGN 수 표기로 (FEN의 수 번호 기준) */
function toPgn(puzzle: Puzzle): string {
  const fields = puzzle.fen.split(" ");
  let number = Number(fields[5]) || 1;
  let white = fields[1] === "w";
  const tokens: string[] = [];
  puzzle.sans.forEach((san, i) => {
    if (white) tokens.push(`${number}. ${san}`);
    else tokens.push(i === 0 ? `${number}... ${san}` : san);
    if (!white) number++;
    white = !white;
  });
  return tokens.join(" ");
}
