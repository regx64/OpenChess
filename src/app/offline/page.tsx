import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "오프라인" };

/** 인터넷이 끊겼고 그 페이지의 저장본도 없을 때 보여 주는 페이지 */
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <WifiOff className="mx-auto size-12 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-bold">오프라인입니다</h1>
      <p className="mt-2 text-muted-foreground">
        이 페이지는 아직 저장되지 않았습니다. 한 번 열어 본 페이지와 분석 보드,
        학습 기록은 인터넷 없이도 쓸 수 있습니다. 정복 현황의 &lsquo;오프라인
        준비&rsquo;로 주요 페이지를 미리 저장해 둘 수 있습니다.
      </p>
      <div className="mt-6 flex justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          분석 보드
        </Link>
        <Link href="/train" className="rounded-md border px-4 py-2">
          학습
        </Link>
      </div>
    </div>
  );
}
