import type { Metadata } from "next";
import Link from "next/link";
import Trainer from "@/components/training/Trainer";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "오프닝 트레이너",
  description:
    "상대 수는 자동으로, 내 수는 직접 맞히며 오프닝 수순을 익힙니다.",
};

export default async function DrillPage() {
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
          오프닝 트레이너
        </h1>
      </div>
      <div>
        <Trainer docs={docs} />
      </div>
    </div>
  );
}
