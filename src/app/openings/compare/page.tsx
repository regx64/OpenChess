import type { Metadata } from "next";
import Link from "next/link";
import OpeningCompare from "@/components/openings/OpeningCompare";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "오프닝 비교",
  description: "두 체스 오프닝의 수순이 어디서 갈라지는지 나란히 비교합니다.",
};

export default async function OpeningComparePage() {
  const docs = await listOpeningDocs();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/openings"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 오프닝
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">오프닝 비교</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        두 오프닝을 골라 수순이 갈라지는 지점을 확인하고, 두 보드를 함께 넘겨
        보세요.
      </p>
      <OpeningCompare docs={docs} />
    </div>
  );
}
