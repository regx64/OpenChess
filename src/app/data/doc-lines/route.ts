import { listDocLines } from "@/lib/openings";
import type { DocSection } from "@/lib/docSections";

// 빌드할 때 한 번 만들어 두는 정적 파일
export const dynamic = "force-static";

/**
 * GET /data/doc-lines
 * → 문서 절마다 그 절에서 다루는 수순 목록 (보드의 수순을 해설 절로 연결할 때 사용)
 */
export async function GET() {
  const sections = new Map<string, DocSection>();
  for (const line of await listDocLines()) {
    const key = `${line.slug}#${line.anchor}`;
    const section = sections.get(key) ?? {
      slug: line.slug,
      heading: line.heading,
      anchor: line.anchor,
      lines: [],
    };
    const text = line.sans.join(" ");
    if (!section.lines.includes(text)) section.lines.push(text);
    sections.set(key, section);
  }
  return Response.json([...sections.values()]);
}
