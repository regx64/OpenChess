import type { MetadataRoute } from "next";
import { serverBook } from "@/lib/serverBook";
import { listOpeningDocs } from "@/lib/openings";
import { ECO_VOLUME_KEYS } from "@/lib/eco";
import { normalizeFileName } from "@/lib/utils";

const SITE = "https://openchess.vercel.app";

/** 모든 오프닝 페이지(해설 문서 + 데이터셋의 모든 이름)를 검색 엔진에 알림 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = await listOpeningDocs();
  const docSlugs = new Set(docs.map((doc) => doc.slug));
  const pages = [
    "",
    "/openings",
    "/openings/tree",
    "/openings/eco",
    "/openings/compare",
  ];
  return [
    ...pages.map((path) => ({ url: `${SITE}${path}`, priority: 1 })),
    ...ECO_VOLUME_KEYS.map((volume) => ({
      url: `${SITE}/openings/eco/${volume}`,
      priority: 0.7,
    })),
    ...docs.map((doc) => ({
      url: `${SITE}/openings/${doc.slug}`,
      priority: 0.9,
    })),
    ...serverBook
      .catalog()
      .map((entry) => normalizeFileName(entry.name))
      .filter((slug) => !docSlugs.has(slug))
      .map((slug) => ({ url: `${SITE}/openings/${slug}`, priority: 0.5 })),
  ];
}
