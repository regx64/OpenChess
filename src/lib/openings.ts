import "server-only";
import { readdir, readFile } from "fs/promises";
import path from "path";

/** 오프닝 문서(MDX)가 들어있는 폴더. 파일 이름이 곧 URL 슬러그 (예: italian-game.mdx → /openings/italian-game) */
const OPENINGS_DIR = path.join(process.cwd(), "openings");

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
 * 요청한 슬러그에 해당하는 문서 슬러그를 찾습니다.
 * 변형 이름(예: italian-game-giuoco-piano)은 문서가 없으면 상위 오프닝(italian-game) 문서로 연결합니다.
 * @returns 문서 슬러그, 없으면 null
 */
export async function resolveOpeningSlug(slug: string): Promise<string | null> {
  const slugs = await listOpeningSlugs();
  if (slugs.includes(slug)) return slug;

  return (
    slugs
      .filter((candidate) => slug.startsWith(`${candidate}-`))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

/**
 * 오프닝 문서의 MDX 원문을 읽습니다
 */
export async function getOpeningSource(slug: string): Promise<string> {
  return readFile(path.join(OPENINGS_DIR, `${slug}.mdx`), "utf8");
}
