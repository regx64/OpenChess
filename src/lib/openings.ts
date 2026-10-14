import "server-only";
import { readdir, readFile } from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { normalizeFileName } from "@/lib/utils";

/** 오프닝 문서(MDX)가 들어있는 폴더. 파일 이름이 곧 URL 슬러그 (예: italian-game.mdx → /openings/italian-game) */
const OPENINGS_DIR = path.join(process.cwd(), "openings");

/** 문서 앞부분(frontmatter)에 적는 메타데이터 */
export interface OpeningDoc {
  slug: string;
  /** 한국어 이름 (예: 이탈리안 게임) */
  title: string;
  /** Lichess 데이터셋의 영문 이름 (예: Italian Game) */
  name: string;
  eco: string;
  /** 대표 수순 */
  pgn: string;
  /** 같은 문서로 연결할 다른 영문 이름들 */
  aliases: string[];
  /** 1. e4, 1. d4 등 분류 */
  group: string;
  /** 한 줄 요약 */
  summary: string;
}

/**
 * 문서가 있는 모든 오프닝 슬러그를 반환합니다
 */
export async function listOpeningSlugs(): Promise<string[]> {
  const files = await readdir(OPENINGS_DIR);
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * 오프닝 문서의 MDX 원문(frontmatter 포함)을 읽습니다
 */
export async function getOpeningSource(slug: string): Promise<string> {
  return readFile(path.join(OPENINGS_DIR, `${slug}.mdx`), "utf8");
}

/**
 * 모든 오프닝 문서의 메타데이터를 반환합니다
 */
export async function listOpeningDocs(): Promise<OpeningDoc[]> {
  const slugs = await listOpeningSlugs();
  return Promise.all(
    slugs.map(async (slug) => {
      const { data } = matter(await getOpeningSource(slug));
      return {
        slug,
        title: data.title ?? slug,
        name: data.name ?? slug,
        eco: data.eco ?? "",
        pgn: data.pgn ?? "",
        aliases: data.aliases ?? [],
        group: data.group ?? "기타",
        summary: data.summary ?? "",
      };
    }),
  );
}

/**
 * 요청한 슬러그에 해당하는 문서 슬러그를 찾습니다.
 * 문서 슬러그, 영문 이름, aliases 중 정확히 일치하거나, 가장 길게 앞부분이 일치하는 문서로 연결합니다.
 * 예: italian-game-giuoco-piano → italian-game, zukertort-opening → reti-opening(alias)
 * @returns 문서 슬러그, 없으면 null
 */
export async function resolveOpeningSlug(slug: string): Promise<string | null> {
  const docs = await listOpeningDocs();
  const keys = docs.flatMap((doc) => [
    { key: doc.slug, slug: doc.slug },
    ...[doc.name, ...doc.aliases].map((alias) => ({
      key: normalizeFileName(alias),
      slug: doc.slug,
    })),
  ]);

  const exact = keys.find(({ key }) => key === slug);
  if (exact) return exact.slug;

  return (
    keys
      .filter(({ key }) => slug.startsWith(`${key}-`))
      .sort((a, b) => b.key.length - a.key.length)[0]?.slug ?? null
  );
}
