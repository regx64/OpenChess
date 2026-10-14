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

/** 문서 본문에 나오는 수순 하나와 그 수순이 있는 절(제목) */
export interface DocLine {
  slug: string;
  /** 절 제목 */
  heading: string;
  /** 절 제목의 id (rehype-slug와 같은 방식) */
  anchor: string;
  /** 수순 (SAN 목록) */
  sans: string[];
}

/** 제목의 마크다운 표시(코드, 강조, 링크)를 걷어낸 글자 */
const headingText = (markdown: string) =>
  markdown
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .trim();

/**
 * 모든 문서의 `1. ...` 수순을 절 제목과 함께 모읍니다.
 * 보드에서 두는 수순과 맞춰 "이 수순을 다루는 해설 절"로 바로 연결할 때 씁니다.
 */
export async function listDocLines(): Promise<DocLine[]> {
  const { Chess } = await import("chess.js");
  const { default: GithubSlugger } = await import("github-slugger");
  const lines: DocLine[] = [];

  for (const slug of await listOpeningSlugs()) {
    const { content } = matter(await getOpeningSource(slug));
    const slugger = new GithubSlugger();
    let heading = "";
    let anchor = "";
    for (const row of content.split("\n")) {
      const title = row.match(/^#{1,6}\s+(.+?)\s*$/);
      if (title) {
        heading = headingText(title[1]);
        anchor = slugger.slug(heading);
        continue;
      }
      if (!anchor) continue;
      for (const [, line] of row.matchAll(/`(1\. [^`]+)`/g)) {
        try {
          const game = new Chess();
          game.loadPgn(line);
          lines.push({ slug, heading, anchor, sans: game.history() });
        } catch {
          // 잘못된 수순은 openings:check가 잡아냄
        }
      }
    }
  }
  return lines;
}
