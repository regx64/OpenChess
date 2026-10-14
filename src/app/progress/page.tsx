import type { Metadata } from "next";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "정복 현황",
  description:
    "3,177개 오프닝 중 본 것·익힌 것·마스터한 것과 ECO별 진도, 학습 기록, 백업",
};

export default async function ProgressPage() {
  const docs = await listOpeningDocs();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="text-3xl font-bold sm:text-4xl">정복 현황</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        모든 오프닝 정복까지 얼마나 왔는지 확인하세요.
      </p>
      <ProgressDashboard docs={docs} />
    </div>
  );
}
