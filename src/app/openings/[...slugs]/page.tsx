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
import {
  getOpeningSource,
  listOpeningDocs,
  listOpeningSlugs,
  resolveOpeningSlug,
} from "@/lib/openings";

type OpeningPageProps = {
  params: Promise<{
    slugs: string[];
  }>;
};

// openings 폴더의 문서는 빌드 시 정적으로 생성하고, 그 외 경로(변형 이름 등)는 요청 시 처리
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await listOpeningSlugs();
  return slugs.map((slug) => ({ slugs: [slug] }));
}

export async function generateMetadata({
  params,
}: OpeningPageProps): Promise<Metadata> {
  const { slugs } = await params;
  const doc = (await listOpeningDocs()).find(
    (doc) => doc.slug === slugs?.join("-").toLowerCase(),
  );
  if (!doc) return {};
  return {
    title: `${doc.title} (${doc.name}) - OpenChess`,
    description: doc.summary,
  };
}

/**
 * 본문의 인라인 코드 중 `1. e4 ...` 형태의 수순은 클릭하면 보드에 표시되는 링크로 렌더링
 */
function InlineCode({ children }: { children?: React.ReactNode }) {
  if (typeof children === "string" && children.startsWith("1. ")) {
    return (
      <Link
        href={`/?pgn=${encodeURIComponent(children)}`}
        title="보드에서 보기"
        className="no-underline"
      >
        <code className="hover:ring-1 hover:ring-primary">{children}</code>
      </Link>
    );
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
  const { slugs } = await params;

  if (!slugs?.length) {
    notFound();
  }

  const requestedSlug = slugs.join("-").toLowerCase();
  const slug = await resolveOpeningSlug(requestedSlug);

  if (!slug) {
    notFound();
  }

  // 변형 이름으로 들어온 경우 상위 오프닝 문서 주소로 이동
  if (slug !== requestedSlug) {
    redirect(`/openings/${slug}`);
  }

  const doc = (await listOpeningDocs()).find((doc) => doc.slug === slug);
  const content = await renderOpeningContent(await getOpeningSource(slug));

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href="/openings"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 오프닝 목록
      </Link>

      {doc && (
        <header className="mt-4 mb-8 border-b pb-6">
          <p className="text-sm text-muted-foreground">
            {doc.eco} · {doc.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{doc.title}</h1>
          {doc.summary && (
            <p className="mt-3 text-muted-foreground">{doc.summary}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded bg-muted px-2 py-1 font-mono text-sm break-words">
              {doc.pgn}
            </code>
            <Link
              href={`/?pgn=${encodeURIComponent(doc.pgn)}`}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              보드에서 보기
            </Link>
          </div>
        </header>
      )}

      <div className="prose prose-slate dark:prose-invert max-w-none prose-code:break-words prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal">
        {content}
      </div>
    </article>
  );
}
