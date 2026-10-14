"use client";

import { trapsStore } from "@/lib/training/progress";

/** 함정 목록의 진도 표시 */
export default function TrapProgressBadge({ id }: { id: string }) {
  const progress = trapsStore.use()[id];
  if (!progress?.set && !progress?.avoid) return null;
  return (
    <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">
      {progress.set && progress.avoid
        ? "걸기·피하기 완료"
        : progress.set
          ? "걸기 완료"
          : "피하기 완료"}
    </span>
  );
}
