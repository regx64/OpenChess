"use client";

import { Chess } from "chess.js";

/**
 * 브라우저 안에서 도는 Stockfish(WASM, Web Worker)와 UCI로 대화하는 래퍼.
 * 엔진 파일(약 7MB)은 처음 켤 때만 받아 옵니다. 엔진은 GPL-3 라이선스의 별도 프로그램입니다(public/engine).
 */

const ENGINE_URL = "/engine/stockfish-18-lite-single.js";

export interface EngineLine {
  /** 몇 번째 후보 (1부터) */
  rank: number;
  depth: number;
  /** 백 기준 점수 (센티폰). 메이트면 null */
  cp: number | null;
  /** 백 기준 메이트까지 수 (양수: 백이 메이트, 음수: 흑이 메이트) */
  mate: number | null;
  /** 최선 수순 (UCI) */
  pv: string[];
  /** 최선 수순 (SAN) */
  san: string[];
}

export interface Analysis {
  fen: string;
  depth: number;
  lines: EngineLine[];
  done: boolean;
}

type Listener = (analysis: Analysis) => void;

/** UCI 수순을 SAN으로 (잘못된 수가 나오면 거기까지) */
export function pvToSan(fen: string, pv: string[]): string[] {
  const chess = new Chess(fen);
  const sans: string[] = [];
  for (const uci of pv) {
    try {
      sans.push(
        chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci[4],
        }).san,
      );
    } catch {
      break;
    }
  }
  return sans;
}

/** "info depth 18 ... multipv 2 score cp -35 ... pv e7e5 g1f3" 한 줄 읽기 (점수는 둘 차례 기준) */
export function parseInfo(line: string) {
  const depth = line.match(/\bdepth (\d+)/);
  const multipv = line.match(/\bmultipv (\d+)/);
  const cp = line.match(/\bscore cp (-?\d+)/);
  const mate = line.match(/\bscore mate (-?\d+)/);
  const pv = line.match(/\bpv (.+)$/);
  if (!depth || (!cp && !mate) || !pv) return null;
  // 상한·하한 점수(lowerbound/upperbound)는 중간 결과라 건너뜀
  if (/\b(lowerbound|upperbound)\b/.test(line)) return null;
  return {
    depth: Number(depth[1]),
    rank: Number(multipv?.[1] ?? 1),
    cp: cp ? Number(cp[1]) : null,
    mate: mate ? Number(mate[1]) : null,
    pv: pv[1].trim().split(/\s+/),
  };
}

/** 점수를 "+0.35", "−1.20", "#3", "#-2" 형태로 */
export function formatScore(line: Pick<EngineLine, "cp" | "mate">): string {
  if (line.mate !== null) return `#${line.mate}`;
  const value = (line.cp ?? 0) / 100;
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;
}

/** 평가 막대용: 백이 이길 확률(0–1)로 바꿈 (Lichess의 승률 근사식) */
export function whiteWinChance(line: Pick<EngineLine, "cp" | "mate">): number {
  if (line.mate !== null) return line.mate > 0 ? 1 : 0;
  const cp = Math.max(-1000, Math.min(1000, line.cp ?? 0));
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

class StockfishEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private listener: Listener | null = null;
  private current: Analysis | null = null;
  private turn: "w" | "b" = "w";
  /** 이전 탐색이 끝나기(bestmove)를 기다리는 중 */
  private stopping = false;
  private pending: { fen: string; depth: number; multiPv: number } | null =
    null;
  private multiPv = 0;

  /** 엔진을 준비합니다 (처음 한 번 파일을 받아 옴) */
  start(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(ENGINE_URL);
      } catch (error) {
        reject(error);
        return;
      }
      this.worker.onerror = (event) => reject(event);
      this.worker.onmessage = (event: MessageEvent<string>) => {
        const line = String(event.data);
        if (line === "uciok") this.send("isready");
        else if (line === "readyok") resolve();
        else this.handle(line);
      };
      this.send("uci");
    });
    return this.ready;
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  private handle(line: string) {
    if (line.startsWith("bestmove")) {
      if (this.stopping) {
        // 멈춘 탐색이 끝남: 끝난 것으로 표시해야 다음 분석 때 다시 stop을 보내지 않음
        this.stopping = false;
        if (this.current) this.current = { ...this.current, done: true };
        if (this.pending) this.go(this.pending);
        return;
      }
      if (this.current) {
        this.current = { ...this.current, done: true };
        this.listener?.(this.current);
      }
      return;
    }
    if (this.stopping || !this.current || !line.startsWith("info")) return;
    const info = parseInfo(line);
    if (!info) return;
    // 엔진 점수는 둘 차례 기준이므로 백 기준으로 바꿈
    const sign = this.turn === "w" ? 1 : -1;
    const entry: EngineLine = {
      rank: info.rank,
      depth: info.depth,
      cp: info.cp === null ? null : info.cp * sign,
      mate: info.mate === null ? null : info.mate * sign,
      pv: info.pv,
      san: pvToSan(this.current.fen, info.pv.slice(0, 12)),
    };
    const lines = [
      ...this.current.lines.filter((l) => l.rank !== entry.rank),
      entry,
    ].sort((a, b) => a.rank - b.rank);
    this.current = {
      ...this.current,
      depth: Math.max(this.current.depth, info.depth),
      lines,
    };
    this.listener?.(this.current);
  }

  private go({
    fen,
    depth,
    multiPv,
  }: {
    fen: string;
    depth: number;
    multiPv: number;
  }) {
    this.pending = null;
    this.turn = fen.split(" ")[1] === "b" ? "b" : "w";
    this.current = { fen, depth: 0, lines: [], done: false };
    if (multiPv !== this.multiPv) {
      this.send(`setoption name MultiPV value ${multiPv}`);
      this.multiPv = multiPv;
    }
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
  }

  /** 위치 분석 시작 (진행 중이던 분석은 멈춤) */
  async analyze(
    fen: string,
    listener: Listener,
    { depth = 20, multiPv = 3 } = {},
  ) {
    await this.start();
    this.listener = listener;
    const request = { fen, depth, multiPv };
    if (this.current && !this.current.done) {
      // 이전 탐색의 bestmove가 올 때까지 기다렸다가 시작
      this.pending = request;
      if (!this.stopping) {
        this.stopping = true;
        this.send("stop");
      }
    } else {
      this.go(request);
    }
  }

  /** 분석 멈춤 */
  stop() {
    this.listener = null;
    this.pending = null;
    if (this.current && !this.current.done && !this.stopping) {
      this.stopping = true;
      this.send("stop");
    }
  }
}

let engine: StockfishEngine | null = null;

/** 앱 전체에서 엔진 하나를 같이 씀 */
export function getEngine(): StockfishEngine {
  engine ??= new StockfishEngine();
  return engine;
}
