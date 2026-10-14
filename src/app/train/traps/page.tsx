import type { Metadata } from "next";
import Link from "next/link";
import { TRAPS } from "@/data/traps";
import TrapProgressBadge from "@/components/training/TrapProgressBadge";

export const metadata: Metadata = {
  title: "오프닝 함정",
  description: "유명한 체스 오프닝 함정을 걸고 피하는 연습",
};

export default function TrapsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        href="/train"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 학습
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">오프닝 함정</h1>
      <p className="mt-2 text-muted-foreground">
        모든 수순과 결말은 체스 규칙 엔진으로 검증했습니다. 함정을 걸어 보고,
        반대편에서 피하는 연습도 해 보세요.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {TRAPS.map((trap) => (
          <li key={trap.id}>
            <Link
              href={`/train/traps/${trap.id}`}
              className="block h-full rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{trap.title}</span>
                <TrapProgressBadge id={trap.id} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {trap.summary}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {trap.trapper === "w" ? "백" : "흑"}이 거는 함정 ·{" "}
                {trap.outcome === "mate"
                  ? "메이트"
                  : trap.outcome === "trapped"
                    ? "기물 포획"
                    : "기물 이득"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
