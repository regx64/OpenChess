import type { Metadata } from "next";
import Link from "next/link";
import { listOpeningDocs, type OpeningDoc } from "@/lib/openings";

export const metadata: Metadata = {
  title: "오프닝 목록 - OpenChess",
  description: "주요 체스 오프닝 해설 문서 목록",
};

/** 목록에 표시할 분류 순서 */
const GROUP_ORDER = [
  "1. e4 e5",
  "1. e4 기타",
  "1. d4 d5",
  "1. d4 Nf6",
  "1. d4 기타",
  "기타 첫 수",
];

export default async function OpeningsIndexPage() {
  const docs = await listOpeningDocs();

  const groups = new Map<string, OpeningDoc[]>();
  for (const doc of docs.sort((a, b) => a.eco.localeCompare(b.eco))) {
    groups.set(doc.group, [...(groups.get(doc.group) ?? []), doc]);
  }
  const groupNames = [...groups.keys()].sort(
    (a, b) =>
      (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <h1 className="text-3xl font-bold sm:text-4xl">오프닝 목록</h1>
      <p className="mt-2 text-muted-foreground">
        주요 오프닝 {docs.length}개의 해설입니다.
      </p>

      {groupNames.map((group) => (
        <section key={group} className="mt-10">
          <h2 className="text-xl font-semibold border-b pb-2">{group}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {groups.get(group)!.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/openings/${doc.slug}`}
                  className="block h-full rounded-lg border p-4 hover:bg-muted"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{doc.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {doc.eco}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {doc.name}
                  </div>
                  <code className="mt-2 block text-xs text-muted-foreground">
                    {doc.pgn}
                  </code>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
