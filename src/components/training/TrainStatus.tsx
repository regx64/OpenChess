"use client";

import Link from "next/link";
import { Flame, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dueCards } from "@/lib/training/lines";
import {
  activityStore,
  cardsStore,
  currentStreak,
  puzzleStore,
  quizStore,
} from "@/lib/training/progress";

/** 학습 허브 상단: 오늘 복습, 연속 학습일, 퍼즐·퀴즈 기록 */
export default function TrainStatus() {
  const cards = cardsStore.use();
  const activity = activityStore.use();
  const puzzles = puzzleStore.use();
  const quiz = quizStore.use();
  const due = dueCards(cards).length;
  const streak = currentStreak(activity);

  const items = [
    { label: "연속 학습", value: `${streak}일` },
    { label: "연습한 수순", value: `${Object.keys(cards).length}개` },
    { label: "퍼즐 레이팅", value: String(puzzles.rating) },
    {
      label: "퀴즈 정답률",
      value: quiz.total
        ? `${Math.round((quiz.correct / quiz.total) * 100)}%`
        : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Flame
            className={
              streak ? "size-8 text-orange-500" : "size-8 text-muted-foreground"
            }
          />
          <div>
            <p className="font-semibold">
              {due
                ? `오늘 복습할 수순 ${due}개`
                : "오늘 복습할 수순이 없습니다"}
            </p>
            <p className="text-sm text-muted-foreground">
              {due
                ? "잊기 직전에 복습하면 오래 기억에 남습니다."
                : "새 오프닝을 연습하거나 퍼즐을 풀어 보세요."}
            </p>
          </div>
        </div>
        {due > 0 && (
          <Button asChild>
            <Link href="/train/drill?mode=review">
              <RotateCcw />
              복습 시작
            </Link>
          </Button>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
