"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import {
  analyzeGame,
  moveLabel,
  parseGame,
  splitPgnGames,
  summarizeByOpening,
  type GameReport,
} from "@/lib/gameAnalysis";
import { koreanName } from "@/lib/koName";
import { openingHref } from "@/lib/openingDetail";
import { treeOf } from "@/lib/repertoire";
import { repertoireStore } from "@/lib/repertoireStore";
import { createPersistentStore } from "@/lib/storage";
import { cn } from "@/lib/utils";

/** 내 이름(대국 헤더에서 내 색을 알아내는 데 사용) */
const nameStore = createPersistentStore<string>("my-name", "");

const MAX_GAMES = 500;

const OUTCOME_LABELS = { win: "승", draw: "무", loss: "패" } as const;

/** 대국 수순만 (보드에서 열기용) */
const gamePgn = (report: GameReport) =>
  report.game.sans
    .map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san))
    .join(" ");

/**
 * 내 기보 분석: PGN(여러 대국)을 붙여 넣으면 오프닝, 이론 이탈 지점, 레퍼토리와 다른 수, 오프닝별 성적을 보여 줍니다.
 */
export default function MyGames() {
  const book = useOpeningBook();
  const myName = nameStore.use();
  const repertoires = repertoireStore.use();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [useRepertoire, setUseRepertoire] = useState(true);

  const result = useMemo(() => {
    if (!book || !submitted.trim()) return null;
    const chunks = splitPgnGames(submitted).slice(0, MAX_GAMES);
    const trees = {
      w: repertoires.find((item) => item.color === "w"),
      b: repertoires.find((item) => item.color === "b"),
    };
    const repertoireTrees = useRepertoire
      ? {
          w: trees.w ? treeOf(trees.w) : undefined,
          b: trees.b ? treeOf(trees.b) : undefined,
        }
      : {};
    let failed = 0;
    const reports: GameReport[] = [];
    chunks.forEach((chunk, i) => {
      const game = parseGame(chunk);
      if (!game) {
        failed++;
        return;
      }
      reports.push(
        analyzeGame(game, i, book, { myName, repertoires: repertoireTrees }),
      );
    });
    return {
      reports,
      failed,
      total: chunks.length,
      summary: summarizeByOpening(reports),
      trees,
    };
  }, [book, submitted, myName, repertoires, useRepertoire]);

  const totals = result && {
    wins: result.reports.filter((r) => r.outcome === "win").length,
    draws: result.reports.filter((r) => r.outcome === "draw").length,
    losses: result.reports.filter((r) => r.outcome === "loss").length,
    mine: result.reports.filter((r) => r.myColor).length,
  };
  const myDeviations =
    result?.reports.filter((r) => r.repertoire?.by === "me") ?? [];
  const opponentSurprises =
    result?.reports.filter((r) => r.repertoire?.by === "opponent") ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="block text-xs font-medium text-muted-foreground">
              내 이름 (대국의 White/Black 이름과 같게)
            </span>
            <input
              value={myName}
              onChange={(event) => nameStore.set(event.target.value)}
              placeholder="예: lichess 아이디"
              className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useRepertoire}
              onChange={(event) => setUseRepertoire(event.target.checked)}
            />
            내 레퍼토리와 비교 (
            {repertoires.length ? `${repertoires.length}개` : "없음"})
          </label>
        </div>
        <textarea
          aria-label="PGN"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            'Lichess·Chess.com에서 내려받은 PGN을 붙여 넣으세요 (여러 대국 가능, 최대 500개)\n\n[Event "Rated Blitz game"]\n[White "me"]\n[Black "opponent"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 ...'
          }
          className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setSubmitted(text)}
            disabled={!text.trim() || !book}
          >
            분석하기
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <FileUp />
              PGN 파일
              <input
                type="file"
                accept=".pgn,.txt"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const content = await file.text();
                  setText(content);
                  setSubmitted(content);
                  event.target.value = "";
                }}
              />
            </label>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          대국은 이 브라우저 안에서만 분석하며 어디에도 보내지 않습니다.
        </p>
      </section>

      {result && totals && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "분석한 대국", value: `${result.reports.length}개` },
              { label: "내 대국", value: `${totals.mine}개` },
              {
                label: "내 성적",
                value: totals.mine
                  ? `${totals.wins}승 ${totals.draws}무 ${totals.losses}패`
                  : "—",
              },
              { label: "읽지 못한 대국", value: `${result.failed}개` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold">{value}</div>
              </div>
            ))}
          </section>
          {!totals.mine && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              내 이름과 같은 선수가 없어 색과 승패를 알 수 없습니다. 위에 대국의
              White/Black에 적힌 내 이름을 넣어 보세요.
            </p>
          )}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">오프닝별 성적</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">오프닝</th>
                    <th className="px-3 py-2 text-right">대국</th>
                    <th className="px-3 py-2 text-right">승·무·패</th>
                    <th className="px-3 py-2 text-right">점수</th>
                    <th className="px-3 py-2 text-right">평균 이론 길이</th>
                  </tr>
                </thead>
                <tbody>
                  {result.summary.map((row) => {
                    const scored = row.wins + row.draws + row.losses;
                    return (
                      <tr key={row.family} className="border-t">
                        <td className="px-3 py-2">
                          {row.family === "알 수 없음" ? (
                            row.family
                          ) : (
                            <Link
                              href={openingHref(row.family)}
                              className="hover:underline"
                            >
                              {koreanName(row.family)}
                            </Link>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">{row.games}</td>
                        <td className="px-3 py-2 text-right">
                          {scored
                            ? `${row.wins}·${row.draws}·${row.losses}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {scored
                            ? `${Math.round(((row.wins + row.draws / 2) / scored) * 100)}%`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.averageBook.toFixed(1)}수
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {(myDeviations.length > 0 || opponentSurprises.length > 0) && (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  내가 레퍼토리와 다르게 둔 대국 {myDeviations.length}
                </h2>
                <ReportList reports={myDeviations} kind="me" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  상대가 준비 밖의 수를 둔 대국 {opponentSurprises.length}
                </h2>
                <ReportList reports={opponentSurprises} kind="opponent" />
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">대국 목록</h2>
            <ReportList reports={result.reports} kind="all" />
          </section>
        </>
      )}
    </div>
  );
}

function ReportList({
  reports,
  kind,
}: {
  reports: GameReport[];
  kind: "me" | "opponent" | "all";
}) {
  if (!reports.length)
    return <p className="text-sm text-muted-foreground">없습니다.</p>;
  return (
    <ul className="divide-y rounded-lg border">
      {reports.slice(0, 100).map((report) => {
        const { game, opening, leftBook, repertoire, outcome } = report;
        return (
          <li key={report.index} className="space-y-1 p-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">
                {game.headers.White ?? "?"} – {game.headers.Black ?? "?"}
              </span>
              <span className="text-xs text-muted-foreground">
                {game.headers.Result ?? "*"}
                {outcome && (
                  <span
                    className={cn(
                      "ml-2 rounded px-1.5 py-0.5",
                      outcome === "win" && "bg-primary/15 text-primary",
                      outcome === "loss" &&
                        "bg-destructive/15 text-destructive",
                      outcome === "draw" && "bg-muted",
                    )}
                  >
                    {OUTCOME_LABELS[outcome]}
                  </span>
                )}
              </span>
            </div>
            {opening && (
              <Link
                href={openingHref(opening.name)}
                className="block text-primary hover:underline"
              >
                {opening.eco} {koreanName(opening.name)}
              </Link>
            )}
            <p className="text-xs text-muted-foreground">
              {leftBook === null
                ? "끝까지 이론 수순"
                : `${moveLabel(leftBook, game.sans[leftBook])}에서 이론을 벗어남 (${
                    report.myColor
                      ? (leftBook % 2 === 0) === (report.myColor === "w")
                        ? "내가"
                        : "상대가"
                      : leftBook % 2 === 0
                        ? "백이"
                        : "흑이"
                  })`}
            </p>
            {repertoire && kind !== "all" && repertoire.deviation !== null && (
              <p className="text-xs">
                {kind === "me"
                  ? `${moveLabel(repertoire.deviation, game.sans[repertoire.deviation])} 대신 레퍼토리는 ${repertoire.expected.join(", ")}`
                  : `상대의 ${moveLabel(repertoire.deviation, game.sans[repertoire.deviation])}: 레퍼토리에 준비 없음`}
              </p>
            )}
            <Link
              href={`/?pgn=${encodeURIComponent(gamePgn(report))}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              분석 보드에서 열기
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
