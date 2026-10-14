import type { Metadata } from "next";
import Link from "next/link";
import OpeningTree from "@/components/openings/OpeningTree";

export const metadata: Metadata = {
  title: "오프닝 계보",
  description: "모든 체스 오프닝을 수순의 갈래로 펼쳐 보는 계보 트리",
};

export default function OpeningTreePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        href="/openings"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 오프닝
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">오프닝 계보</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        첫 수부터 갈래를 따라 모든 오프닝을 펼쳐 볼 수 있습니다. 파란 수순은 위
        갈래에서 이어지는 수이고, &lsquo;하위&rsquo;는 그 아래에 있는 오프닝
        수입니다.
      </p>
      <OpeningTree />
    </div>
  );
}
