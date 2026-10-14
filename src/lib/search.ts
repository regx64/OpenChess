import { Chess } from "chess.js";
import type { OpeningBook } from "@/lib/openingBook";
import type { DocRef } from "@/lib/docsIndex";
import { koreanName } from "@/lib/koName";

export interface SearchEntry {
  name: string;
  eco: string;
  pgn: string;
  node: number;
  /** 한국어 표기 */
  ko: string;
  /** 이 오프닝 자체를 다루는 한국어 문서 */
  doc?: DocRef;
}

export interface SearchResult extends SearchEntry {
  /** 수순으로 찾았을 때 그 위치에 정확히 해당하는지 */
  exact?: boolean;
}

interface IndexedEntry extends SearchEntry {
  en: string;
  enWords: string[];
  koText: string;
  koCompact: string;
  chosung: string;
}

export interface SearchIndex {
  book: OpeningBook;
  entries: IndexedEntry[];
}

const CHOSUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

/** 한글의 초성만 뽑음 (예: "시실리안" → "ㅅㅅㄹㅇ") */
export function toChosung(text: string): string {
  let result = "";
  for (const char of text) {
    const code = char.charCodeAt(0) - 0xac00;
    if (code >= 0 && code <= 11171) result += CHOSUNG[Math.floor(code / 588)];
    else if (/[ㄱ-ㅎ]/.test(char)) result += char;
  }
  return result;
}

/** 대소문자·악센트·아포스트로피·하이픈을 무시하고 비교 */
export const normalizeEnglish = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/-/g, " ")
    .toLowerCase();

const hasHangul = (text: string) => /[ㄱ-ㅎ가-힣]/.test(text);
const isChosungOnly = (text: string) => /^[ㄱ-ㅎ\s]+$/.test(text);

/** 편집 거리 (오타 허용 검색용, limit을 넘으면 일찍 끝냄) */
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}

export function buildSearchIndex(
  book: OpeningBook,
  docs: DocRef[],
): SearchIndex {
  const entries = book.catalog().map((entry): IndexedEntry => {
    const doc = docs.find(
      (d) => d.name === entry.name || d.aliases.includes(entry.name),
    );
    const ko = koreanName(entry.name);
    const koText = `${ko} ${doc?.title ?? ""}`;
    const en = normalizeEnglish(
      `${entry.name} ${doc?.aliases.join(" ") ?? ""}`,
    );
    return {
      name: entry.name,
      eco: entry.eco,
      pgn: entry.pgn,
      node: entry.node,
      ko,
      doc,
      en,
      enWords: en.split(/[\s:,()]+/).filter(Boolean),
      koText,
      koCompact: koText.replace(/\s+/g, ""),
      chosung: toChosung(koText),
    };
  });
  return { book, entries };
}

/** 수순처럼 보이는 입력을 SAN 목록으로 (아니면 null) */
function parseMoves(query: string): string[] | null {
  const tokens = query
    .replace(/\d+\.(\.\.)?/g, " ")
    .split(/[\s,]+/)
    .filter(Boolean);
  if (
    !tokens.length ||
    !tokens.every((t) =>
      /^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?|O-O(-O)?[+#]?|0-0(-0)?)$/.test(
        t,
      ),
    )
  ) {
    return null;
  }
  const game = new Chess();
  try {
    for (const token of tokens) game.move(token.replace(/0/g, "O"));
  } catch {
    return null;
  }
  return game.history();
}

/** 수순으로 찾기: 그 위치의 오프닝과 그 아래 이어지는 오프닝들 */
function searchByMoves(
  index: SearchIndex,
  sans: string[],
  limit: number,
): SearchResult[] {
  const { book } = index;
  const game = new Chess();
  for (const san of sans) game.move(san);
  const starts = book.nodesAt(game.fen());
  if (!starts.length) return [];

  const exactName = book.openingAt(game.fen())?.name;
  const found = new Map<number, number>(); // node → depth below
  const queue = starts.map((node) => ({ node, depth: 0 }));
  while (queue.length && found.size < limit * 4) {
    const { node, depth } = queue.shift()!;
    if (book.nameOf[node] >= 0 && !found.has(node)) found.set(node, depth);
    for (const child of book.children[node])
      queue.push({ node: child, depth: depth + 1 });
  }
  const byName = new Map(index.entries.map((entry) => [entry.name, entry]));
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  for (const [node] of [...found].sort((a, b) => a[1] - b[1])) {
    const name = book.opening(node)!.name;
    const entry = byName.get(name);
    if (!entry || seen.has(name)) continue;
    seen.add(name);
    results.push({ ...entry, exact: name === exactName });
  }
  return results
    .sort((a, b) => Number(b.exact ?? false) - Number(a.exact ?? false))
    .slice(0, limit);
}

/**
 * 오프닝 검색: 한국어(초성 포함)·영문(오타 허용)·ECO 코드·수순을 모두 받습니다.
 */
export function searchOpenings(
  index: SearchIndex,
  rawQuery: string,
  limit = 20,
): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];

  // 1) 수순 (예: "e4 c5 Nf3", "1. d4 Nf6 2. c4")
  const sans = parseMoves(query);
  if (sans) return searchByMoves(index, sans, limit);

  // 2) ECO 코드 (예: "B90", "C4")
  if (/^[A-Ea-e]\d{0,2}$/.test(query)) {
    const prefix = query.toUpperCase();
    return index.entries
      .filter((entry) => entry.eco.startsWith(prefix))
      .sort(
        (a, b) => a.eco.localeCompare(b.eco) || a.name.length - b.name.length,
      )
      .slice(0, limit);
  }

  const scored: { entry: IndexedEntry; score: number }[] = [];

  if (hasHangul(query)) {
    // 3) 한국어 / 초성
    const compact = query.replace(/\s+/g, "");
    const chosungOnly = isChosungOnly(query);
    for (const entry of index.entries) {
      const target = chosungOnly
        ? entry.chosung.replace(/\s+/g, "")
        : entry.koCompact;
      const at = target.indexOf(compact);
      if (at < 0) continue;
      scored.push({
        entry,
        score:
          (at === 0 ? 0 : 1000) + (entry.doc ? 0 : 300) + entry.name.length,
      });
    }
  } else {
    // 4) 영문 (단어마다 포함, 없으면 오타 허용)
    const tokens = normalizeEnglish(query)
      .split(/[\s:,]+/)
      .filter(Boolean);
    for (const entry of index.entries) {
      let score = 0;
      let ok = true;
      for (const [i, token] of tokens.entries()) {
        const at = entry.en.indexOf(token);
        if (at >= 0) {
          const wordStart = at === 0 || /[\s:,(]/.test(entry.en[at - 1]);
          score += at === 0 && i === 0 ? 0 : wordStart ? 200 : 600;
          continue;
        }
        if (token.length < 4) {
          ok = false;
          break;
        }
        const allowed = token.length >= 7 ? 2 : 1;
        const best = Math.min(
          ...entry.enWords.map((word) =>
            editDistance(token, word.slice(0, token.length + 1), allowed),
          ),
          ...entry.enWords.map((word) => editDistance(token, word, allowed)),
        );
        if (best > allowed) {
          ok = false;
          break;
        }
        score += 1500 * best;
      }
      if (ok)
        scored.push({
          entry,
          score: score + (entry.doc ? 0 : 300) + entry.name.length,
        });
    }
  }

  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
