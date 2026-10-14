import type { Metadata } from "next";
import Link from "next/link";
import Quiz from "@/components/training/Quiz";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "오프닝 퀴즈",
  description: "장면·이름·수순·ECO로 오프닝 지식을 확인합니다.",
};

export default async function QuizPage() {
  const docs = await listOpeningDocs();
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
          오프닝 퀴즈
        </h1>
      </div>
      <div>
        <Quiz docs={docs} />
      </div>
    </div>
  );
}
