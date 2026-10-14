import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import ChessDiagram from "@/components/openings/ChessDiagram";
import remarkToc from "remark-toc";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { BookOpen, GitBranch, Puzzle, Repeat, Scale } from "lucide-react";
import ViewTracker from "@/components/training/ViewTracker";
import OpeningNote from "@/components/openings/OpeningNote";
import { normalizeFileName } from "@/lib/utils";
import {
  getOpeningSource,
  listOpeningDocs,
  listOpeningSlugs,
  resolveOpeningSlug,
  type OpeningDoc,
} from "@/lib/openings";
import { serverBook } from "@/lib/serverBook";
import {
  boardHref,
  findBySlug,
  openingDetail,
  type OpeningDetail,
} from "@/lib/openingDetail";
import { findDocForName } from "@/lib/docsIndex";
import { koreanName } from "@/lib/koName";
import LineViewer from "@/components/board/LineViewer";
import { DocBoardLayout, MoveLine } from "@/components/openings/DocBoard";
import {
  EcoBadge,
  OpeningBreadcrumbs,
  OpeningSections,
} from "@/components/openings/OpeningSections";

type OpeningPageProps = {
  params: Promise<{
    slugs: string[];
  }>;
};

// 해설 문서는 빌드 때 만들고, 나머지 오프닝(데이터셋의 모든 이름)은 처음 요청될 때 만들어 저장
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await listOpeningSlugs();
  return slugs.map((slug) => ({ slugs: [slug] }));
}

const requested = async (params: OpeningPageProps["params"]) =>
  (await params).slugs?.join("-").toLowerCase() ?? "";

export async function generateMetadata({
  params,
}: OpeningPageProps): Promise<Metadata> {
  const slug = await requested(params);
  const doc = (await listOpeningDocs()).find((doc) => doc.slug === slug);
  if (doc) {
    return {
      title: `${doc.title} (${doc.name})`,
      description: doc.summary,
    };
  }
  const entry = findBySlug(serverBook, slug);
  if (!entry) return {};
  return {
    title: `${koreanName(entry.name)} (${entry.name})`,
    description: `${entry.eco} ${entry.name}: ${entry.pgn}`,
  };
}

/** 본문의 인라인 코드 중 `1. e4 ...` 형태의 수순은 누르면 문서 보드에서 재생 */
function InlineCode({ children }: { children?: React.ReactNode }) {
  if (typeof children === "string" && children.startsWith("1. ")) {
    return <MoveLine>{children}</MoveLine>;
  }
  return <code>{children}</code>;
}

async function renderOpeningContent(source: string) {
  const { content } = await compileMDX({
    source,
    components: {
      ChessDiagram,
      code: InlineCode,
      // 모바일에서 넓은 표는 가로로 스크롤
      table: (props: React.ComponentProps<"table">) => (
        <div className="overflow-x-auto">
          <table {...props} />
        </div>
      ),
    },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkToc, remarkGfm, remarkBreaks],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              properties: {
                className: ["anchor"],
              },
            },
          ],
        ],
      },
    },
  });

  return content;
}

export default async function OpeningPage({ params }: OpeningPageProps) {
  const slug = await requested(params);
  if (!slug) notFound();

  const docs = await listOpeningDocs();
  const doc = docs.find((doc) => doc.slug === slug);
  if (doc) return <DocPage doc={doc} />;

  const entry = findBySlug(serverBook, slug);
  if (entry) {
    return (
      <NamePage
        detail={openingDetail(serverBook, entry)}
        doc={findDocForName(docs, entry.name)}
      />
    );
  }

  // 예전 주소(문서 별칭 등)는 해당 문서로 이동
  const resolved = await resolveOpeningSlug(slug);
  if (resolved) redirect(`/openings/${resolved}`);
  notFound();
}

/** 계보·비교 바로 가기 */
function OpeningTools({ name }: { name: string }) {
  const slug = normalizeFileName(name);
  // 수비 이름이면 흑, 아니면 백으로 연습
  const color = /Defense|Defence|Countergambit/.test(name.split(":")[0])
    ? "b"
    : "w";
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <ViewTracker name={name} />
      <Link
        href={`/train/drill?opening=${slug}&color=${color}`}
        className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-primary/10 px-2.5 py-1 hover:bg-primary/20"
      >
        <Repeat className="size-3.5" />
        트레이너로 연습
      </Link>
      <Link
        href={`/train/puzzles?opening=${encodeURIComponent(name.split(":")[0])}`}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 hover:bg-muted"
      >
        <Puzzle className="size-3.5" />이 계열 퍼즐
      </Link>
      <Link
        href={`/openings/tree?focus=${slug}`}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 hover:bg-muted"
      >
        <GitBranch className="size-3.5" />
        계보에서 보기
      </Link>
      <Link
        href={`/openings/compare?a=${slug}`}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 hover:bg-muted"
      >
        <Scale className="size-3.5" />
        다른 오프닝과 비교
      </Link>
    </div>
  );
}

/** 한국어 해설 문서 */
async function DocPage({ doc }: { doc: OpeningDoc }) {
  const content = await renderOpeningContent(await getOpeningSource(doc.slug));
  const entry =
    findBySlug(serverBook, doc.slug) ??
    serverBook.catalog().find((item) => item.name === doc.name);
  const detail = entry ? openingDetail(serverBook, entry) : null;

  return (
    <DocBoardLayout mainPgn={doc.pgn} title={doc.title}>
      <article className="py-6 sm:py-8">
        <Link
          href="/openings"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 오프닝
        </Link>

        <header className="mb-8 mt-4 border-b pb-6">
          {detail && <OpeningBreadcrumbs detail={detail} />}
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <EcoBadge eco={doc.eco} />
            {doc.name}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{doc.title}</h1>
          {doc.summary && (
            <p className="mt-3 text-muted-foreground">{doc.summary}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <MoveLine>{doc.pgn}</MoveLine>
            <Link
              href={boardHref(doc.pgn)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              분석 보드에서 열기
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            본문의 수순을 누르면 옆(모바일은 아래) 보드에서 바로 재생됩니다.
          </p>
          <div className="mt-3 space-y-3">
            <OpeningTools name={doc.name} />
            <OpeningNote name={doc.name} />
          </div>
        </header>

        <div className="prose prose-slate max-w-none dark:prose-invert prose-code:break-words prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
          {content}
        </div>

        {detail && (
          <div className="mt-12 border-t pt-8">
            <h2 className="mb-1 text-2xl font-bold">
              데이터셋으로 보는 {doc.title}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Lichess 오프닝 데이터셋에 이름이 붙은 하위 변형을 모두 보여
              줍니다.
            </p>
            <OpeningSections detail={detail} />
          </div>
        )}
      </article>
    </DocBoardLayout>
  );
}

/** 해설 문서가 없는 오프닝: 데이터셋으로 자동 생성한 페이지 */
function NamePage({
  detail,
  doc,
}: {
  detail: OpeningDetail;
  doc: OpeningDoc | null;
}) {
  const { entry } = detail;
  const ko = koreanName(entry.name);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href="/openings"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 오프닝
      </Link>

      <header className="mb-6 mt-4 space-y-2 border-b pb-6">
        <OpeningBreadcrumbs detail={detail} />
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <EcoBadge eco={entry.eco} />
          {entry.name}
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">{ko}</h1>
        <OpeningTools name={entry.name} />
        <OpeningNote name={entry.name} />
        {doc && (
          <Link
            href={`/openings/${doc.slug}`}
            className="mt-2 flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-muted"
          >
            <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold">
                한국어 해설: {doc.title}
              </span>
              <span className="block text-sm text-muted-foreground">
                {doc.summary}
              </span>
            </span>
          </Link>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[420px] lg:sticky lg:top-20 lg:self-start">
          <LineViewer pgn={entry.pgn} />
        </div>
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-lg font-semibold">대표 수순</h2>
            <p className="mt-2 break-words font-mono">{entry.pgn}</p>
          </section>
          <OpeningSections detail={detail} />
        </div>
      </div>
    </div>
  );
}
