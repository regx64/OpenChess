"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Download,
  Flame,
  HardDriveDownload,
  MonitorSmartphone,
  RotateCcw,
  Trophy,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/components/analysis/ShareDialog";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import { koreanName } from "@/lib/koName";
import { openingHref } from "@/lib/openingDetail";
import { ECO_VOLUME_KEYS } from "@/lib/eco";
import { clearAllStores, createBackup, restoreBackup } from "@/lib/storage";
import { isStandalone, precacheForOffline, useInstallPrompt } from "@/lib/pwa";
import { dueCards } from "@/lib/training/lines";
import {
  groupProgress,
  rankFor,
  summarizeMastery,
} from "@/lib/training/mastery";
import {
  activityStore,
  cardsStore,
  currentStreak,
  puzzleStore,
  quizStore,
  trapsStore,
  viewedStore,
} from "@/lib/training/progress";
import { cardLevel, LEVEL_LABELS, today } from "@/lib/training/srs";
import { TRAPS } from "@/data/traps";
import { cn } from "@/lib/utils";

type Metric = "learned" | "seen";

/**
 * 정복 대시보드: 3,177개 오프닝 중 본 것·익힌 것·마스터한 것, ECO별 히트맵, 활동 기록, 다음 목표, 데이터 관리
 */
export default function ProgressDashboard({ docs }: { docs: DocRef[] }) {
  const book = useOpeningBook();
  const cards = cardsStore.use();
  const viewed = viewedStore.use();
  const quiz = quizStore.use();
  const puzzles = puzzleStore.use();
  const traps = trapsStore.use();
  const activity = activityStore.use();
  const [metric, setMetric] = useState<Metric>("learned");

  const summary = useMemo(
    () =>
      book
        ? summarizeMastery({
            catalog: book.catalog(),
            cards,
            viewed,
            quizSolved: quiz.solved,
          })
        : null,
    [book, cards, viewed, quiz.solved],
  );
  const byEco = useMemo(
    () =>
      book && summary
        ? groupProgress(book.catalog(), summary.status, (e) => e.eco)
        : null,
    [book, summary],
  );
  const byFamily = useMemo(
    () =>
      book && summary
        ? [
            ...groupProgress(
              book.catalog(),
              summary.status,
              (e) => e.name.split(":")[0],
            ).values(),
          ]
            .sort((a, b) => b.total - a.total)
            .slice(0, 16)
        : [],
    [book, summary],
  );

  if (!book || !summary || !byEco) {
    return <p className="text-sm text-muted-foreground">기록을 불러오는 중…</p>;
  }

  const { current: rank, next: nextRank } = rankFor(summary.learned);
  const streak = currentStreak(activity);
  const due = dueCards(cards);
  const levelCounts = { new: 0, learning: 0, known: 0, mastered: 0 };
  for (const card of Object.values(cards)) levelCounts[cardLevel(card)]++;
  const trapsDone = TRAPS.filter(
    (t) => traps[t.id]?.set && traps[t.id]?.avoid,
  ).length;

  // 다음에 볼 오프닝: 아직 안 본 것 중 해설 문서가 있거나 하위 수순이 많은 것
  const suggestions = book
    .catalog()
    .filter((entry) => summary.status.get(entry.name) === "unseen")
    .map((entry) => ({
      entry,
      weight:
        (docs.some((d) => d.name === entry.name) ? 1000 : 0) +
        book.lineCount[entry.node] -
        entry.plies,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  const percent = (value: number) =>
    `${((value / summary.total) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-10">
      {/* 칭호와 총계 */}
      <section className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <Trophy className="size-12 shrink-0 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">지금 단계</p>
            <p className="text-2xl font-bold">{rank.title}</p>
            {nextRank && (
              <p className="text-sm text-muted-foreground">
                다음 단계 「{nextRank.title}」까지{" "}
                {nextRank.min - summary.learned}개 더 익히기
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "본 오프닝",
              value: summary.seen,
              hint: "페이지·퀴즈·연습",
            },
            {
              label: "익힌 오프닝",
              value: summary.learned,
              hint: "트레이너 2회 이상 정답",
            },
            {
              label: "마스터",
              value: summary.mastered,
              hint: "복습 간격 21일 이상",
            },
          ].map(({ label, value, hint }) => (
            <div key={label} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-2xl font-bold">{value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {percent(value)} · {hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div
          className="flex h-4 overflow-hidden rounded-full bg-muted"
          aria-label="전체 정복도"
        >
          <div
            className="bg-primary"
            style={{ width: percent(summary.mastered) }}
          />
          <div
            className="bg-primary/60"
            style={{ width: percent(summary.learned - summary.mastered) }}
          />
          <div
            className="bg-primary/25"
            style={{ width: percent(summary.seen - summary.learned) }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          전체 {summary.total.toLocaleString()}개 오프닝 · 진한 색부터 마스터,
          익힘, 봄
        </p>
      </section>

      {/* 다음 목표 */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">다음 목표</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">오늘 복습 {due.length}개</p>
            <p className="text-sm text-muted-foreground">
              {due.length
                ? "복습할 때가 된 수순이 있습니다."
                : "복습할 수순이 없습니다."}
            </p>
            {due.length > 0 && (
              <Button size="sm" className="mt-2" asChild>
                <Link href="/train/drill?mode=review">복습 시작</Link>
              </Button>
            )}
          </div>
          <div className="rounded-lg border p-4 md:col-span-2">
            <p className="font-semibold">다음에 볼 오프닝</p>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {suggestions.map(({ entry }) => (
                <li key={entry.name} className="truncate">
                  <Link
                    href={openingHref(entry.name)}
                    className="hover:underline"
                  >
                    <span className="mr-1 font-mono text-xs text-muted-foreground">
                      {entry.eco}
                    </span>
                    {koreanName(entry.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ECO 히트맵 */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">ECO별 진도</h2>
          <div
            className="inline-flex rounded-md bg-muted p-1 text-sm"
            role="radiogroup"
          >
            {(["learned", "seen"] as Metric[]).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={metric === value}
                onClick={() => setMetric(value)}
                className={cn(
                  "rounded px-3 py-1",
                  metric === value
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {value === "learned" ? "익힌 비율" : "본 비율"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ECO_VOLUME_KEYS.map((volume) => (
            <div key={volume}>
              <div className="mb-1 text-sm font-semibold">{volume}권</div>
              <div className="grid grid-cols-10 gap-0.5">
                {Array.from({ length: 100 }, (_, i) => {
                  const code = `${volume}${String(i).padStart(2, "0")}`;
                  const group = byEco.get(code);
                  if (!group)
                    return (
                      <span
                        key={code}
                        className="aspect-square rounded-sm bg-muted/30"
                      />
                    );
                  const ratio =
                    (metric === "learned" ? group.learned : group.seen) /
                    group.total;
                  return (
                    <Link
                      key={code}
                      href={`/openings/eco/${volume}#${code}`}
                      title={`${code}: ${group.total}개 중 본 것 ${group.seen}, 익힌 것 ${group.learned}`}
                      className="aspect-square rounded-sm ring-primary hover:ring-1"
                      style={{
                        backgroundColor: ratio
                          ? `hsl(var(--primary) / ${0.2 + 0.8 * ratio})`
                          : "hsl(var(--muted))",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 계열별 진도 */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">주요 오프닝 계열</h2>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {byFamily.map((group) => (
            <li key={group.key}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <Link
                  href={openingHref(group.key)}
                  className="truncate hover:underline"
                >
                  {koreanName(group.key)}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  익힘 {group.learned} · 봄 {group.seen} / {group.total}
                </span>
              </div>
              <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary"
                  style={{ width: `${(group.learned / group.total) * 100}%` }}
                />
                <div
                  className="bg-primary/30"
                  style={{
                    width: `${((group.seen - group.learned) / group.total) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 활동 */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Flame
            className={cn(
              "size-5",
              streak ? "text-orange-500" : "text-muted-foreground",
            )}
          />
          연속 학습 {streak}일
        </h2>
        <ActivityCalendar activity={activity} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "연습 카드",
              value: `${Object.keys(cards).length}개`,
              hint: (["learning", "known", "mastered"] as const)
                .map((level) => `${LEVEL_LABELS[level]} ${levelCounts[level]}`)
                .join(" · "),
            },
            {
              label: "퍼즐",
              value: `${puzzles.rating}`,
              hint: `${puzzles.solved}/${puzzles.attempts} 성공`,
            },
            {
              label: "퀴즈",
              value: quiz.total
                ? `${Math.round((quiz.correct / quiz.total) * 100)}%`
                : "—",
              hint: `${quiz.correct}/${quiz.total} · 최고 연속 ${quiz.bestStreak}`,
            },
            {
              label: "함정",
              value: `${trapsDone}/${TRAPS.length}`,
              hint: "걸기·피하기 모두 성공",
            },
          ].map(({ label, value, hint }) => (
            <div key={label} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-xl font-semibold">{value}</div>
              <div className="text-xs text-muted-foreground">{hint}</div>
            </div>
          ))}
        </div>
      </section>

      <DataManagement docs={docs} />
    </div>
  );
}

/** 최근 16주 활동 달력 */
function ActivityCalendar({
  activity,
}: {
  activity: Record<string, Partial<Record<string, number>>>;
}) {
  const end = today();
  const weeks = 16;
  // 오늘이 마지막 열에 오도록, 일요일 시작 주로 맞춤
  const lastWeekday = new Date(end * 86400000).getUTCDay();
  const start = end - (weeks - 1) * 7 - lastWeekday;
  const days = Array.from({ length: weeks * 7 }, (_, i) => start + i);
  const count = (day: number) =>
    Object.values(activity[String(day)] ?? {}).reduce(
      (sum: number, n) => sum + (n ?? 0),
      0,
    );
  const max = Math.max(1, ...days.map(count));
  return (
    <div className="overflow-x-auto">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-0.5">
        {days.map((day) => {
          const n = day > end ? -1 : count(day);
          return (
            <span
              key={day}
              title={
                n >= 0
                  ? `${new Date(day * 86400000).toLocaleDateString("ko-KR")}: ${n}회`
                  : ""
              }
              className="size-3 rounded-[2px]"
              style={{
                backgroundColor:
                  n < 0
                    ? "transparent"
                    : n === 0
                      ? "hsl(var(--muted))"
                      : `hsl(var(--primary) / ${0.3 + 0.7 * (n / max)})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** 백업·복원·오프라인 준비·앱 설치·초기화 */
function DataManagement({ docs }: { docs: DocRef[] }) {
  const install = useInstallPrompt();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const prepareOffline = async () => {
    const urls = [
      "/",
      "/openings",
      "/openings/tree",
      "/openings/eco",
      ...ECO_VOLUME_KEYS.map((v) => `/openings/eco/${v}`),
      "/openings/compare",
      "/train",
      "/train/drill",
      "/train/quiz",
      "/train/traps",
      "/train/puzzles",
      "/train/games",
      "/courses",
      "/recommend",
      "/repertoire",
      "/repertoire/edit",
      "/my-games",
      "/progress",
      "/data/doc-lines",
      "/data/puzzles.json",
      "/engine/stockfish-18-lite-single.js",
      "/engine/stockfish-18-lite-single.wasm",
      ...docs.map((doc) => `/openings/${doc.slug}`),
    ];
    setOffline({ done: 0, total: urls.length });
    const ok = await precacheForOffline(urls, (done, total) =>
      setOffline({ done, total }),
    );
    if (!ok) {
      setOffline(null);
      setMessage(
        "이 브라우저에서는 오프라인 저장을 쓸 수 없습니다 (배포된 사이트에서 동작합니다).",
      );
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">데이터 관리</h2>
      <p className="text-sm text-muted-foreground">
        모든 학습 기록·레퍼토리·설정은 이 브라우저에만 저장됩니다. 다른 기기로
        옮기거나 잃어버리지 않도록 가끔 백업하세요.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            downloadText(
              `openchess-backup-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(createBackup(), null, 2),
              "application/json",
            )
          }
        >
          <Download />
          백업 파일 저장
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload />
          백업에서 되살리기
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="백업 파일"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              const count = restoreBackup(JSON.parse(await file.text()));
              setMessage(`${count}개 항목을 되살렸습니다. 새로고침합니다…`);
              setTimeout(() => window.location.reload(), 800);
            } catch (error) {
              setMessage(
                (error as Error).message || "백업 파일을 읽지 못했습니다.",
              );
            }
          }}
        />
        <Button
          variant="outline"
          onClick={prepareOffline}
          disabled={offline !== null && offline.done < offline.total}
        >
          <HardDriveDownload />
          오프라인 준비
        </Button>
        {install && !isStandalone() && (
          <Button variant="outline" onClick={install}>
            <MonitorSmartphone />
            앱으로 설치
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-destructive"
          onClick={() => {
            if (
              window.confirm(
                "모든 학습 기록·레퍼토리·설정을 지울까요? 되돌릴 수 없습니다. 먼저 백업하는 것을 권합니다.",
              )
            ) {
              clearAllStores();
              window.location.reload();
            }
          }}
        >
          <RotateCcw />
          기록 모두 지우기
        </Button>
      </div>
      {offline && (
        <p className="text-sm">
          오프라인 저장 {offline.done}/{offline.total}
          {offline.done >= offline.total &&
            " · 완료! 인터넷이 없어도 주요 페이지와 엔진·퍼즐을 쓸 수 있습니다."}
        </p>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {!install && !isStandalone() && (
        <p className="text-xs text-muted-foreground">
          휴대폰 홈 화면에 앱처럼 설치하려면 브라우저 메뉴의 &lsquo;홈 화면에
          추가&rsquo;(iPhone은 공유 → 홈 화면에 추가)를 누르세요.
        </p>
      )}
    </section>
  );
}
