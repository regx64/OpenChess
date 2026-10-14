import type { Metadata } from "next";
import Link from "next/link";
import Recommender from "@/components/recommend/Recommender";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "오프닝 추천",
  description: "스타일·수준·이론 부담에 맞는 백·흑 오프닝을 추천합니다.",
};

export default async function RecommendPage() {
  const docs = await listOpeningDocs();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/train"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 학습
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">오프닝 추천</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        세 가지 질문에 답하면 백으로 둘 오프닝과 흑으로 1. e4·1. d4를 상대할
        오프닝을 추천합니다.
      </p>
      <Recommender docs={docs} />
    </div>
  );
}
