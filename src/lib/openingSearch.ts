import "server-only";
import openingNames from "@/data/opening-names.json";
import { listOpeningDocs } from "@/lib/openings";

export interface OpeningSearchResult {
  eco: string;
  name: string;
  pgn: string;
  /** 한국어 문서가 있는 경우 한국어 이름 */
  title?: string;
}

// [eco, name, pgn] 형태로 저장됨 (bin/build-openings.ts 참고)
const names: string[][] = openingNames;

/** 대소문자·악센트·아포스트로피를 무시하고 비교하기 위한 정규화 */
const normalize = (text: string): string =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").toLowerCase();

/**
 * 오프닝 이름(영문), ECO 코드, 한국어 문서 제목으로 오프닝을 검색합니다
 * @param query - 검색어 (예: "najdorf", "B90", "시칠리안")
 * @param limit - 최대 결과 수
 */
export async function searchOpenings(
  query: string,
  limit = 20,
): Promise<OpeningSearchResult[]> {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const docs = await listOpeningDocs();
  const titleByName = new Map(
    docs.flatMap((doc) =>
      [doc.name, ...doc.aliases].map((name) => [name, doc.title] as const),
    ),
  );

  const candidates: OpeningSearchResult[] = [
    // 한국어 문서 제목 검색용 (영문 이름과 같은 결과로 합쳐짐)
    ...docs.map(({ eco, name, pgn, title }) => ({ eco, name, pgn, title })),
    ...names.map(([eco, name, pgn]) => ({
      eco,
      name,
      pgn,
      title: titleByName.get(name),
    })),
  ];

  const scored = new Map<
    string,
    { result: OpeningSearchResult; score: number }
  >();

  for (const result of candidates) {
    const name = normalize(result.name);
    const haystack = `${name} ${normalize(result.title ?? "")} ${result.eco.toLowerCase()}`;
    if (!tokens.every((token) => haystack.includes(token))) continue;

    // 낮을수록 위에 표시: 이름이 검색어로 시작 > 단어가 검색어로 시작 > 포함
    const first = tokens[0];
    const score =
      (name.startsWith(first) || normalize(result.title ?? "").startsWith(first)
        ? 0
        : new RegExp(
              `(^|[\\s:,-])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
            ).test(haystack)
          ? 1
          : 2) *
        1000 +
      (result.title ? 0 : 500) +
      result.name.length;

    const previous = scored.get(result.name);
    if (!previous || score < previous.score) {
      scored.set(result.name, { result, score });
    }
  }

  return [...scored.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ result }) => result);
}
