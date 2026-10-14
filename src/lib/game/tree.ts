import { Chess, type Square } from "chess.js";
import { INITIAL_FEN } from "@/types/chess";

/** 수순 트리의 한 노드. 루트는 시작 위치이고 나머지는 각각 한 수를 나타냅니다. */
export interface MoveNode {
  id: number;
  /** 이 수를 둔 쪽 기준 수 번호 (루트는 시작 FEN의 수 번호) */
  moveNumber: number;
  /** 이 수를 둔 쪽 ("w" | "b"). 루트는 시작 위치에서 둘 차례의 반대 */
  color: "w" | "b";
  san: string;
  /** e2e4, e7e8q 형식 */
  uci: string;
  from: Square;
  to: Square;
  /** 이 수를 둔 뒤의 위치 */
  fen: string;
  parent: MoveNode | null;
  /** 첫 번째 자식이 본선, 나머지는 변화수 */
  children: MoveNode[];
  comment?: string;
  /** 수 평가 기호 (PGN NAG 번호, 예: 1 = !, 2 = ?) */
  nags?: number[];
}

export interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

/** 수 평가 기호와 PGN NAG 번호 */
export const NAG_SYMBOLS: Record<number, string> = {
  1: "!",
  2: "?",
  3: "!!",
  4: "??",
  5: "!?",
  6: "?!",
};

const SUFFIX_TO_NAG: Record<string, number> = Object.fromEntries(
  Object.entries(NAG_SYMBOLS).map(([nag, symbol]) => [symbol, Number(nag)]),
);

/** 수순 판정용으로 하나만 만들어 재사용 */
const engine = new Chess();

function fenInfo(fen: string): { turn: "w" | "b"; moveNumber: number } {
  const fields = fen.split(" ");
  return {
    turn: fields[1] === "b" ? "b" : "w",
    moveNumber: Number(fields[5]) || 1,
  };
}

/**
 * 변화수를 담을 수 있는 수순 트리.
 * 화면 상태(현재 노드)도 함께 들고 있으며, 바뀔 때마다 구독자에게 알립니다 (useSyncExternalStore용).
 */
export class GameTree {
  root!: MoveNode;
  current!: MoveNode;
  /** 바뀔 때마다 증가 (React 렌더링 트리거) */
  version = 0;
  private nextId = 0;
  private listeners = new Set<() => void>();

  constructor(fen: string = INITIAL_FEN) {
    this.reset(fen);
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  private changed() {
    this.version++;
    for (const listener of this.listeners) listener();
  }

  private makeRoot(fen: string): MoveNode {
    const { turn, moveNumber } = fenInfo(fen);
    return {
      id: this.nextId++,
      // 루트 다음 수가 백이면 루트는 "흑이 둔 0수"처럼 취급
      moveNumber: turn === "w" ? moveNumber - 1 : moveNumber,
      color: turn === "w" ? "b" : "w",
      san: "",
      uci: "",
      from: "a1",
      to: "a1",
      fen,
      parent: null,
      children: [],
    };
  }

  /** 새 시작 위치로 트리를 비웁니다 (FEN이 잘못되면 예외) */
  reset(fen: string = INITIAL_FEN): void {
    engine.load(fen);
    this.root = this.makeRoot(engine.fen());
    this.current = this.root;
    this.changed();
  }

  get startFen(): string {
    return this.root.fen;
  }

  get isStandardStart(): boolean {
    return this.root.fen === INITIAL_FEN;
  }

  /**
   * parent 위치에서 수를 둔 결과 노드를 반환합니다. 같은 수가 이미 있으면 그 노드를, 없으면 새로 만듭니다.
   * 현재 노드는 바꾸지 않습니다. 둘 수 없는 수면 null.
   */
  addMove(parent: MoveNode, move: string | MoveInput): MoveNode | null {
    engine.load(parent.fen);
    let result;
    try {
      result = engine.move(move);
    } catch {
      return null;
    }
    const existing = parent.children.find((child) => child.san === result.san);
    if (existing) return existing;

    const { moveNumber } = fenInfo(parent.fen);
    const node: MoveNode = {
      id: this.nextId++,
      moveNumber,
      color: result.color,
      san: result.san,
      uci: result.from + result.to + (result.promotion ?? ""),
      from: result.from,
      to: result.to,
      fen: engine.fen(),
      parent,
      children: [],
    };
    parent.children.push(node);
    return node;
  }

  /** 현재 위치에서 수를 두고 그 노드로 이동합니다 (이미 있는 수면 그 노드로 이동만) */
  play(move: string | MoveInput): MoveNode | null {
    const node = this.addMove(this.current, move);
    if (!node) return null;
    this.current = node;
    this.changed();
    return node;
  }

  /** 여러 수를 차례로 둡니다. 하나라도 둘 수 없으면 그 앞까지만 두고 false */
  playLine(moves: string[]): boolean {
    let node = this.current;
    for (const move of moves) {
      const next = this.addMove(node, move);
      if (!next) {
        this.current = node;
        this.changed();
        return false;
      }
      node = next;
    }
    this.current = node;
    this.changed();
    return true;
  }

  goTo(node: MoveNode): void {
    if (node === this.current) return;
    this.current = node;
    this.changed();
  }

  back(): boolean {
    if (!this.current.parent) return false;
    this.goTo(this.current.parent);
    return true;
  }

  forward(): boolean {
    const next = this.current.children[0];
    if (!next) return false;
    this.goTo(next);
    return true;
  }

  toStart(): void {
    this.goTo(this.root);
  }

  /** 현재 노드에서 본선을 따라 끝까지 */
  toEnd(): void {
    let node = this.current;
    while (node.children[0]) node = node.children[0];
    this.goTo(node);
  }

  /** 루트부터 node까지의 수 (루트 제외) */
  pathTo(node: MoveNode = this.current): MoveNode[] {
    const path: MoveNode[] = [];
    for (let n: MoveNode | null = node; n && n.parent; n = n.parent) {
      path.push(n);
    }
    return path.reverse();
  }

  /** node 다음부터 첫 번째 자식을 따라가는 본선 */
  mainlineFrom(node: MoveNode = this.root): MoveNode[] {
    const line: MoveNode[] = [];
    for (let n = node.children[0]; n; n = n.children[0]) line.push(n);
    return line;
  }

  /** 루트에서 본선만 따라 도달하는 노드인지 */
  isMainline(node: MoveNode): boolean {
    for (let n = node; n.parent; n = n.parent) {
      if (n.parent.children[0] !== n) return false;
    }
    return true;
  }

  /** 변화수를 한 단계 위(본선 쪽)로 올립니다 */
  promote(node: MoveNode): void {
    for (let n = node; n.parent; n = n.parent) {
      const siblings = n.parent.children;
      const index = siblings.indexOf(n);
      if (index > 0) {
        siblings.splice(index, 1);
        siblings.unshift(n);
        this.changed();
        return;
      }
    }
  }

  /** 노드와 그 아래 수를 모두 지웁니다. 현재 노드가 지워지면 부모로 이동 */
  remove(node: MoveNode): void {
    const parent = node.parent;
    if (!parent) return;
    parent.children = parent.children.filter((child) => child !== node);
    for (let n: MoveNode | null = this.current; n; n = n.parent) {
      if (n === node) {
        this.current = parent;
        break;
      }
    }
    this.changed();
  }

  setComment(node: MoveNode, comment: string): void {
    node.comment = comment.trim() || undefined;
    this.changed();
  }

  /** 수 평가 기호를 켜고 끕니다. 기호는 한 수에 하나만 */
  toggleNag(node: MoveNode, nag: number): void {
    node.nags = node.nags?.includes(nag) ? [] : [nag];
    if (!node.nags.length) node.nags = undefined;
    this.changed();
  }

  /** 트리 전체를 다른 트리 내용으로 바꿉니다 (불러오기 실패 시 원래 트리를 유지하기 위해 사용) */
  private replaceWith(other: GameTree, current: MoveNode): void {
    this.root = other.root;
    this.current = current;
    this.nextId = other.nextId;
    this.changed();
  }

  /**
   * PGN(변화수·주석·NAG 포함)을 불러옵니다. 잘못된 PGN이면 트리를 그대로 두고 false.
   * 불러온 뒤에는 본선의 마지막 수로 이동합니다.
   */
  loadPgn(pgn: string): boolean {
    try {
      const parsed = parsePgn(pgn);
      let end = parsed.root;
      while (end.children[0]) end = end.children[0];
      this.replaceWith(parsed, end);
      return true;
    } catch {
      return false;
    }
  }

  /** FEN 위치에서 새로 시작 (잘못된 FEN이면 false) */
  loadFen(fen: string): boolean {
    try {
      this.reset(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * PGN으로 내보냅니다.
   * @param options.headers 헤더 태그 포함 여부 (시작 위치가 표준이 아니면 FEN 헤더는 항상 포함)
   * @param options.variations 변화수 포함 여부
   * @param options.comments 주석·평가 기호 포함 여부
   */
  toPgn(
    options: {
      headers?: Record<string, string>;
      variations?: boolean;
      comments?: boolean;
    } = {},
  ): string {
    const { variations = true, comments = true } = options;
    const headers = { ...options.headers };
    if (!this.isStandardStart) {
      headers.SetUp = "1";
      headers.FEN = this.root.fen;
    }
    const tags = Object.entries(headers).map(
      ([key, value]) => `[${key} "${value.replace(/"/g, '\\"')}"]`,
    );

    const tokens: string[] = [];
    if (comments && this.root.comment) tokens.push(`{ ${this.root.comment} }`);
    writeMoves(this.root, true, tokens, { variations, comments });
    if (options.headers) tokens.push(headers.Result ?? "*");

    const body = tokens.join(" ");
    return tags.length ? `${tags.join("\n")}\n\n${body}` : body;
  }

  /** 루트부터 현재 노드까지 수순만 (주석·변화수 없이) */
  linePgn(node: MoveNode = this.current): string {
    const tokens: string[] = [];
    this.pathTo(node).forEach((move, index) => {
      if (move.color === "w") tokens.push(`${move.moveNumber}.`);
      else if (index === 0) tokens.push(`${move.moveNumber}...`);
      tokens.push(move.san);
    });
    return tokens.join(" ");
  }

  /** 루트부터 node까지 각 위치의 FEN (루트 포함) */
  fensTo(node: MoveNode = this.current): string[] {
    return [this.root.fen, ...this.pathTo(node).map((move) => move.fen)];
  }

  /** id로 노드 찾기 */
  find(id: number): MoveNode | null {
    const stack = [this.root];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.id === id) return node;
      stack.push(...node.children);
    }
    return null;
  }
}

function moveToken(node: MoveNode, forceNumber: boolean): string {
  if (node.color === "w") return `${node.moveNumber}. ${node.san}`;
  return forceNumber ? `${node.moveNumber}... ${node.san}` : node.san;
}

function annotations(node: MoveNode, options: { comments: boolean }): string[] {
  if (!options.comments) return [];
  const tokens = (node.nags ?? []).map((nag) => `$${nag}`);
  if (node.comment) tokens.push(`{ ${node.comment.replace(/}/g, ")")} }`);
  return tokens;
}

/** parent 다음 수들을 PGN 토큰으로 씁니다 (본선 → 변화수 → 본선 이어서) */
function writeMoves(
  parent: MoveNode,
  forceNumber: boolean,
  tokens: string[],
  options: { variations: boolean; comments: boolean },
): void {
  let node = parent;
  let force = forceNumber;
  while (node.children.length) {
    const [main, ...others] = node.children;
    tokens.push(moveToken(main, force), ...annotations(main, options));
    force = Boolean(options.comments && main.comment);

    if (options.variations) {
      for (const variation of others) {
        tokens.push(
          `(${moveToken(variation, true)}`,
          ...annotations(variation, options),
        );
        writeMoves(variation, Boolean(variation.comment), tokens, options);
        tokens[tokens.length - 1] += ")";
      }
      if (others.length) force = true;
    }
    node = main;
  }
}

const TOKEN_RE =
  /\[[^\]]*\]|\{[^}]*\}|;[^\n]*|\$\d+|\(|\)|\d+\.(?:\.\.)?|1-0|0-1|1\/2-1\/2|\*|[^\s(){};$]+/g;

/**
 * PGN 문자열을 트리로 파싱합니다 (변화수, 주석, NAG, FEN 헤더 지원).
 * 둘 수 없는 수가 있으면 예외를 던집니다.
 */
export function parsePgn(pgn: string): GameTree {
  const fenHeader = pgn.match(/\[FEN\s+"([^"]+)"\]/)?.[1];
  const tree = new GameTree(fenHeader ?? INITIAL_FEN);

  let cursor = tree.root;
  const stack: MoveNode[] = [];

  for (const token of pgn.match(TOKEN_RE) ?? []) {
    if (token.startsWith("[")) continue;
    if (token.startsWith("{") || token.startsWith(";")) {
      const text = token
        .replace(/^[{;]|}$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (text) {
        cursor.comment = cursor.comment ? `${cursor.comment} ${text}` : text;
      }
      continue;
    }
    if (token.startsWith("$")) {
      if (cursor !== tree.root) {
        cursor.nags = [...(cursor.nags ?? []), Number(token.slice(1))];
      }
      continue;
    }
    if (token === "(") {
      if (!cursor.parent) throw new Error("변화수 위치가 잘못되었습니다");
      stack.push(cursor);
      cursor = cursor.parent;
      continue;
    }
    if (token === ")") {
      const saved = stack.pop();
      if (!saved) throw new Error("괄호 짝이 맞지 않습니다");
      cursor = saved;
      continue;
    }
    if (
      /^\d+\.(\.\.)?$/.test(token) ||
      /^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
    ) {
      continue;
    }

    // 수 뒤에 붙은 평가 기호 (예: Nf3!?)
    const [, rawSan, suffix] = token.match(/^(.*?)([!?]{1,2})?$/)!;
    const san = rawSan.replace(/^0-0-0/, "O-O-O").replace(/^0-0/, "O-O");
    if (!san) continue;
    const node = tree.addMove(cursor, san);
    if (!node) throw new Error(`둘 수 없는 수: ${token}`);
    if (suffix && SUFFIX_TO_NAG[suffix]) node.nags = [SUFFIX_TO_NAG[suffix]];
    cursor = node;
  }

  if (stack.length) throw new Error("괄호가 닫히지 않았습니다");
  return tree;
}
