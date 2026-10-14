import type { Metadata } from "next";
import Link from "next/link";
import MyGames from "@/components/mygames/MyGames";

export const metadata: Metadata = {
  title: "내 기보 분석",
  description:
    "내 대국 PGN을 붙여 넣으면 오프닝, 이론 이탈 지점, 레퍼토리와 다른 수, 오프닝별 성적을 보여 줍니다.",
};

export default function MyGamesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/repertoire"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 내 레퍼토리
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">내 기보 분석</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        실전에서 어떤 오프닝을 두었는지, 어디서 이론을 벗어났는지, 레퍼토리를 잘
        지켰는지 확인하세요.
      </p>
      <MyGames />
    </div>
  );
}
