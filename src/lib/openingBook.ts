import { positionKey } from "@/lib/epd";

/**
 * bin/build-openings.ts가 만드는 오프닝 트리 파일 형식 (열 단위 배열)
 * 노드 0은 시작 위치이고, i번째 노드의 정보는 각 배열의 i번째 값입니다.
 */
export interface OpeningTreeData {
  /** [ECO, 영문 이름] */
  names: [string, string][];
  /** 부모 노드 번호 (루트는 -1) */
  parent: number[];
  /** 부모에서 이 노드로 오는 수 (SAN) */
  san: string[];
  /** 이 노드 위치의 조회 키 (positionKey) */
  key: string[];
  /** 이 노드에서 끝나는 오프닝의 names 번호 (없으면 -1) */
  name: number[];
}

export interface OpeningName {
  eco: string;
  name: string;
}

/** 오프닝 탐색기에 표시할 다음 수 후보 */
export interface BookMove {
  san: string;
  /** 이 수를 두었을 때 도달하는 노드 */
  node: number;
  /** 이 수를 두면 이름이 붙는 오프닝 (없으면 null) */
  opening: OpeningName | null;
  /** 이 수 아래에 있는 이름 붙은 수순 개수 (자기 자신 포함) */
  lines: number;
}

/** SAN 목록을 "1. e4 e5 2. Nf3" 형태의 수순 문자열로 바꿉니다 */
export function sansToPgn(sans: string[], startPly = 0): string {
  return sans
    .map((san, i) => {
      const ply = startPly + i;
      if (ply % 2 === 0) return `${ply / 2 + 1}. ${san}`;
      return i === 0 ? `${Math.floor(ply / 2) + 1}... ${san}` : san;
    })
    .join(" ");
}

/**
 * Lichess 오프닝 데이터셋 전체를 담은 수순 트리.
 * 위치 조회 키로 노드를 찾으므로 다른 수순으로 같은 위치에 도달해도(트랜스포지션) 같은 오프닝으로 판별합니다.
 */
export class OpeningBook {
  readonly names: OpeningName[];
  readonly parent: number[];
  readonly san: string[];
  readonly key: string[];
  readonly nameOf: number[];
  readonly children: number[][];
  /** 노드 아래에 있는 이름 붙은 수순 수 (자기 자신 포함) */
  readonly lineCount: number[];
  private readonly nodesByKey = new Map<string, number[]>();
  private readonly nodesByName: number[][];

  constructor(data: OpeningTreeData) {
    this.names = data.names.map(([eco, name]) => ({ eco, name }));
    this.parent = data.parent;
    this.san = data.san;
    this.key = data.key;
    this.nameOf = data.name;

    const size = data.parent.length;
    this.children = Array.from({ length: size }, () => []);
    this.lineCount = new Array(size).fill(0);
    this.nodesByName = Array.from({ length: this.names.length }, () => []);

    for (let node = 0; node < size; node++) {
      if (node > 0) this.children[data.parent[node]].push(node);
      const list = this.nodesByKey.get(data.key[node]);
      if (list) list.push(node);
      else this.nodesByKey.set(data.key[node], [node]);
      if (data.name[node] >= 0) this.nodesByName[data.name[node]].push(node);
    }

    // 자식 번호는 항상 부모보다 크므로 뒤에서부터 더하면 한 번에 부분 트리 합계가 나옴
    for (let node = size - 1; node >= 0; node--) {
      if (data.name[node] >= 0) this.lineCount[node] += 1;
      if (node > 0) this.lineCount[data.parent[node]] += this.lineCount[node];
    }
  }

  get size(): number {
    return this.parent.length;
  }

  /** 노드에서 끝나는 오프닝 (없으면 null) */
  opening(node: number): OpeningName | null {
    const index = this.nameOf[node];
    return index >= 0 ? this.names[index] : null;
  }

  /** 같은 위치(조회 키)에 해당하는 모든 노드 */
  nodesAt(fenOrKey: string): number[] {
    const key = fenOrKey.includes("/") ? positionKey(fenOrKey) : fenOrKey;
    return this.nodesByKey.get(key) ?? [];
  }

  /**
   * 위치에 붙은 오프닝 이름. 여러 수순이 같은 위치에 도달하면 데이터셋에서 더 나중에 나온(더 구체적인) 이름을 씁니다.
   */
  openingAt(fenOrKey: string): OpeningName | null {
    let best = -1;
    for (const node of this.nodesAt(fenOrKey)) {
      best = Math.max(best, this.nameOf[node]);
    }
    return best >= 0 ? this.names[best] : null;
  }

  /**
   * FEN 목록(보통 현재 위치부터 과거 순)에서 처음으로 이름이 알려진 위치를 찾습니다
   */
  lookup(fens: string[]): { opening: OpeningName; index: number } | null {
    for (const [index, fen] of fens.entries()) {
      const opening = this.openingAt(fen);
      if (opening) return { opening, index };
    }
    return null;
  }

  /**
   * 이 위치에서 데이터셋에 있는 다음 수 후보들 (트랜스포지션으로 합쳐진 수순 포함)
   * 아래에 수순이 많은 수부터 정렬합니다.
   */
  movesFrom(fenOrKey: string): BookMove[] {
    const bySan = new Map<string, BookMove>();
    for (const node of this.nodesAt(fenOrKey)) {
      for (const child of this.children[node]) {
        const san = this.san[child];
        const previous = bySan.get(san);
        if (!previous || this.lineCount[child] > previous.lines) {
          bySan.set(san, {
            san,
            node: child,
            opening: this.openingAt(this.key[child]),
            lines: Math.max(this.lineCount[child], previous?.lines ?? 0),
          });
        }
      }
    }
    return [...bySan.values()].sort((a, b) => b.lines - a.lines);
  }

  /** 루트에서 노드까지의 수 (SAN) */
  path(node: number): string[] {
    const sans: string[] = [];
    for (let n = node; n > 0; n = this.parent[n]) sans.push(this.san[n]);
    return sans.reverse();
  }

  /** 루트에서 노드까지의 수순 문자열 */
  pgn(node: number): string {
    return sansToPgn(this.path(node));
  }

  /** 노드 깊이 (반수) */
  depth(node: number): number {
    let depth = 0;
    for (let n = node; n > 0; n = this.parent[n]) depth++;
    return depth;
  }

  /** 노드의 가장 가까운 이름 붙은 조상 (자기 자신 제외) */
  namedAncestor(node: number): number | null {
    for (let n = this.parent[node]; n >= 0; n = this.parent[n]) {
      if (this.nameOf[n] >= 0) return n;
    }
    return null;
  }

  /** 오프닝 이름 번호에 해당하는 노드들 (같은 이름의 다른 수순) */
  nodesOfName(index: number): number[] {
    return this.nodesByName[index] ?? [];
  }

  /** 오프닝 이름의 대표(가장 짧은) 수순 노드 */
  mainNodeOfName(index: number): number {
    const nodes = this.nodesOfName(index);
    return nodes.reduce(
      (best, node) => (this.depth(node) < this.depth(best) ? node : best),
      nodes[0],
    );
  }

  /** 이름으로 번호 찾기 */
  indexOfName(name: string): number {
    return this.names.findIndex((opening) => opening.name === name);
  }

  private catalogCache: CatalogEntry[] | null = null;

  /**
   * 이름별로 하나씩, 대표(가장 짧은) 수순과 함께 정리한 전체 오프닝 목록.
   * 같은 이름이 여러 ECO에 걸쳐 있으면 대표 수순의 ECO를 씁니다.
   */
  catalog(): CatalogEntry[] {
    if (this.catalogCache) return this.catalogCache;
    const byName = new Map<string, { node: number; depth: number }>();
    for (let node = 0; node < this.size; node++) {
      const index = this.nameOf[node];
      if (index < 0) continue;
      const { name } = this.names[index];
      const depth = this.depth(node);
      const previous = byName.get(name);
      if (!previous || depth < previous.depth)
        byName.set(name, { node, depth });
    }
    this.catalogCache = [...byName.values()]
      .map(({ node, depth }) => ({
        ...this.names[this.nameOf[node]],
        node,
        plies: depth,
        pgn: this.pgn(node),
      }))
      .sort(
        (a, b) => a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name),
      );
    return this.catalogCache;
  }
}

/** 전체 오프닝 목록의 한 항목 */
export interface CatalogEntry extends OpeningName {
  /** 대표 수순 노드 */
  node: number;
  /** 대표 수순 길이 (반수) */
  plies: number;
  /** 대표 수순 */
  pgn: string;
}

let cached: OpeningBook | null = null;
let loading: Promise<OpeningBook> | null = null;

/**
 * 오프닝 트리를 불러옵니다. 파일이 커서(약 350KB) 처음 필요할 때 한 번만 따로 받아 옵니다.
 */
export function loadOpeningBook(): Promise<OpeningBook> {
  if (cached) return Promise.resolve(cached);
  loading ??= import("@/data/opening-tree.json").then((module) => {
    cached = new OpeningBook(
      (module.default ?? module) as unknown as OpeningTreeData,
    );
    return cached;
  });
  return loading;
}

/** 이미 불러온 오프닝 트리 (아직이면 null) */
export function getLoadedOpeningBook(): OpeningBook | null {
  return cached;
}
