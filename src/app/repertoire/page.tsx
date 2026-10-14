import type { Metadata } from "next";
import RepertoireList from "@/components/repertoire/RepertoireList";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "내 레퍼토리",
  description:
    "백·흑 오프닝 레퍼토리를 만들고, 준비 안 된 수순(구멍)을 찾아 채우고, 연습합니다.",
};

export default async function RepertoirePage() {
  const docs = await listOpeningDocs();
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="text-3xl font-bold sm:text-4xl">내 레퍼토리</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        내가 둘 오프닝을 수순 트리로 정리해 두면, 상대의 주요 응수 중 준비하지
        않은 곳을 찾아 주고 트레이너로 연습할 수 있습니다. 레퍼토리는 이
        브라우저에 저장됩니다.
      </p>
      <RepertoireList docs={docs} />
    </div>
  );
}
