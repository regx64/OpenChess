"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { Course } from "@/data/courses";
import {
  autoDone,
  courseChecksStore,
  stepHref,
} from "@/lib/training/courseProgress";
import {
  cardsStore,
  puzzleStore,
  trapsStore,
  viewedStore,
} from "@/lib/training/progress";
import { cardLevel, LEVEL_LABELS } from "@/lib/training/srs";
import { cn } from "@/lib/utils";

const KIND_LABELS = {
  doc: "읽기",
  drill: "연습",
  trap: "함정",
  puzzles: "퍼즐",
  game: "명국",
  quiz: "퀴즈",
} as const;

/** 코스의 단계별 완료 상태 */
export function useCourseStatus(
  course: Course,
  docNames: Record<string, string>,
) {
  const sources = {
    viewed: viewedStore.use(),
    cards: cardsStore.use(),
    traps: trapsStore.use(),
    puzzles: puzzleStore.use(),
    docNames,
  };
  const checks = courseChecksStore.use()[course.id] ?? [];
  const steps = course.steps.map((step, index) => {
    const auto = autoDone(step, sources);
    return { step, index, auto, done: auto === true || checks.includes(index) };
  });
  return { steps, sources, done: steps.filter((s) => s.done).length };
}

export function CourseProgressBar({
  course,
  docNames,
}: {
  course: Course;
  docNames: Record<string, string>;
}) {
  const { done } = useCourseStatus(course, docNames);
  const percent = Math.round((done / course.steps.length) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">
        {done}/{course.steps.length}
      </span>
    </div>
  );
}

/** 코스 단계 목록 */
export default function CourseView({
  course,
  docNames,
}: {
  course: Course;
  docNames: Record<string, string>;
}) {
  const { steps, sources } = useCourseStatus(course, docNames);
  const toggle = (index: number) =>
    courseChecksStore.set((all) => {
      const current = all[course.id] ?? [];
      return {
        ...all,
        [course.id]: current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index],
      };
    });

  return (
    <div className="space-y-4">
      <CourseProgressBar course={course} docNames={docNames} />
      <ol className="space-y-2">
        {steps.map(({ step, index, auto, done }) => {
          const card =
            step.kind === "drill"
              ? sources.cards[`${step.color}|${step.target}`]
              : undefined;
          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                done && "border-primary/40 bg-primary/5",
              )}
            >
              <button
                type="button"
                onClick={() => auto !== true && toggle(index)}
                disabled={auto === true}
                aria-label={done ? "완료" : "완료로 표시"}
                title={
                  auto === null
                    ? "직접 완료 표시"
                    : "학습 기록으로 자동 표시됩니다"
                }
                className="shrink-0"
              >
                {done ? (
                  <CheckCircle2 className="size-6 text-primary" />
                ) : (
                  <Circle className="size-6 text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">
                  {index + 1}단계 · {KIND_LABELS[step.kind]}
                  {card && ` · ${LEVEL_LABELS[cardLevel(card)]}`}
                </div>
                <Link
                  href={stepHref(step)}
                  className="font-medium hover:underline"
                >
                  {step.title}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        읽기·연습·함정·퍼즐 단계는 학습 기록으로 자동 체크되고, 명국·퀴즈 단계는
        직접 체크합니다.
      </p>
    </div>
  );
}
