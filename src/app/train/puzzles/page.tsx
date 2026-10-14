import type { Metadata } from "next";
import Link from "next/link";
import Puzzles from "@/components/training/Puzzles";

export const metadata: Metadata = {
  title: "오프닝별 퍼즐",
  description:
    "실제 대국에서 나온 전술 퍼즐을 오프닝·전술별로 풉니다 (Lichess 퍼즐, CC0).",
};

export default function PuzzlesPage() {
  return (
    <div className="mx-auto max-w-6xl py-6 sm:px-4 sm:py-8">
      <div className="px-4 sm:px-0">
        <Link
          href="/train"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 학습
        </Link>
        <h1 className="mb-6 mt-4 text-3xl font-bold sm:text-4xl">
          오프닝별 퍼즐
        </h1>
      </div>
      <div>
        <Puzzles />
      </div>
    </div>
  );
}
