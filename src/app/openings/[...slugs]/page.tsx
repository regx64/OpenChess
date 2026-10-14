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

async function renderOpeningContent(source: string) {
  const { content } = await compileMDX({
    source,
    components: {
      ChessDiagram,
    },
    options: {
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

  const content = await renderOpeningContent(await getOpeningSource(slug));

  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {content}
      </div>
    </article>
  );
}
