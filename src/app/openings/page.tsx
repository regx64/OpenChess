import type { Metadata } from "next";
import Link from "next/link";
import { GitBranch, Grid3x3, Scale } from "lucide-react";
import { listOpeningDocs, type OpeningDoc } from "@/lib/openings";
import { serverBook } from "@/lib/serverBook";
import HubSearch from "@/components/openings/HubSearch";

/** 오프닝 탐색 도구 */
const TOOLS = [
  {
    href: "/openings/tree",
    icon: GitBranch,
    title: "오프닝 계보",
    description: "첫 수부터 갈래를 따라 모든 오프닝을 펼쳐 보기",
  },
  {
    href: "/openings/eco",
    icon: Grid3x3,
    title: "ECO 분류",
    description: "A00–E99 코드로 모든 오프닝을 분류해 보기",
  },
  {
    href: "/openings/compare",
    icon: Scale,
    title: "오프닝 비교",
    description: "두 오프닝이 어디서 갈라지는지 나란히 보기",
  },
];

export const metadata: Metadata = {
  title: "오프닝",
  description: "모든 체스 오프닝 검색, 계보, ECO 분류, 비교와 주요 오프닝 해설",
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
      <h1 className="text-3xl font-bold sm:text-4xl">오프닝</h1>
      <p className="mt-2 text-muted-foreground">
        이름 붙은 오프닝 {serverBook.catalog().length.toLocaleString()}개를 모두
        찾아볼 수 있고, 주요 오프닝 {docs.length}개는 한국어 해설이 있습니다.
      </p>

      <div className="mt-6">
        <HubSearch docs={docs} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {TOOLS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted"
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold">한국어 해설</h2>

      {groupNames.map((group) => (
        <section key={group} className="mt-8">
          <h3 className="text-lg font-semibold border-b pb-2">{group}</h3>
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
