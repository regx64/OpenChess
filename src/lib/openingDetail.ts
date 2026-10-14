import type { CatalogEntry, OpeningBook } from "@/lib/openingBook";
import { normalizeFileName } from "@/lib/utils";

/** 오프닝 이름 → 페이지 주소 */
export const openingHref = (name: string) =>
  `/openings/${normalizeFileName(name)}`;

/** 오프닝 수순 → 분석 보드 주소 */
export const boardHref = (pgn: string) => `/?pgn=${encodeURIComponent(pgn)}`;

export interface OpeningLink {
  name: string;
  eco: string;
  pgn: string;
}

export interface OpeningDetail {
  entry: CatalogEntry;
  /** 이 이름에 도달하는 모든 수순 (대표 수순 포함, 짧은 순) */
  lines: string[];
  /** 상위 오프닝 (가까운 것이 마지막) */
  ancestors: OpeningLink[];
  /** 바로 아래 하위 변형 (아래 수순이 많은 순) */
  children: (OpeningLink & { continuation: string; lines: number })[];
  /** 이 오프닝 아래에 있는 이름 붙은 수순 수 (자기 제외) */
  descendants: number;
  /** 같은 위치에 다른 이름으로도 도달하는 오프닝 */
  sameWith: OpeningLink[];
}

const catalogBySlug = new WeakMap<OpeningBook, Map<string, CatalogEntry>>();

/** 주소용 이름(slug)으로 오프닝 찾기 */
export function findBySlug(
  book: OpeningBook,
  slug: string,
): CatalogEntry | null {
  let map = catalogBySlug.get(book);
  if (!map) {
    map = new Map(
      book.catalog().map((entry) => [normalizeFileName(entry.name), entry]),
    );
    catalogBySlug.set(book, map);
  }
  return map.get(slug) ?? null;
}

const toLink = (book: OpeningBook, node: number): OpeningLink => {
  const opening = book.opening(node)!;
  return { name: opening.name, eco: opening.eco, pgn: book.pgn(node) };
};

/** 이름 붙은 노드 목록을 이름별로 하나씩만 남김 (처음 나온 것 우선) */
function uniqueByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.name) && seen.add(item.name));
}

export function openingDetail(
  book: OpeningBook,
  entry: CatalogEntry,
): OpeningDetail {
  const nameNodes = book.names
    .map((opening, index) => (opening.name === entry.name ? index : -1))
    .filter((index) => index >= 0)
    .flatMap((index) => book.nodesOfName(index))
    .sort((a, b) => book.depth(a) - book.depth(b));
  const nodeSet = new Set(nameNodes);

  // 상위 오프닝: 대표 수순을 거슬러 올라가며 만나는 이름 (같은 이름은 건너뜀)
  const ancestors: OpeningLink[] = [];
  for (
    let n = book.namedAncestor(entry.node);
    n !== null;
    n = book.namedAncestor(n)
  ) {
    ancestors.unshift(toLink(book, n));
  }

  // 하위 변형: 이 이름의 노드들 아래에서 처음 만나는 다른 이름
  const children: OpeningDetail["children"] = [];
  let descendants = 0;
  const stack = nameNodes.flatMap((node) =>
    book.children[node].map((child) => ({ child, from: node })),
  );
  const seenNodes = new Set<number>();
  while (stack.length) {
    const { child, from } = stack.pop()!;
    if (seenNodes.has(child) || nodeSet.has(child)) continue;
    seenNodes.add(child);
    const opening = book.opening(child);
    if (opening && opening.name !== entry.name) {
      const path = book.path(child);
      const start = book.depth(from);
      children.push({
        ...toLink(book, child),
        continuation: path.slice(start).join(" "),
        lines: book.lineCount[child],
      });
      continue;
    }
    for (const next of book.children[child]) stack.push({ child: next, from });
  }
  // 아래에 있는 모든 다른 이름의 수
  const below = new Set<string>();
  const queue = [...nameNodes];
  const visited = new Set<number>();
  while (queue.length) {
    const node = queue.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    const opening = book.opening(node);
    if (opening && opening.name !== entry.name) below.add(opening.name);
    queue.push(...book.children[node]);
  }
  descendants = below.size;

  const sameWith = uniqueByName(
    book
      .nodesAt(book.key[entry.node])
      .filter(
        (node) => book.opening(node) && book.opening(node)!.name !== entry.name,
      )
      .map((node) => toLink(book, node)),
  );

  return {
    entry,
    lines: [...new Set(nameNodes.map((node) => book.pgn(node)))],
    ancestors: uniqueByName(ancestors).filter((a) => a.name !== entry.name),
    children: uniqueByName(children).sort(
      (a, b) => b.lines - a.lines || a.name.localeCompare(b.name),
    ),
    descendants,
    sameWith,
  };
}
