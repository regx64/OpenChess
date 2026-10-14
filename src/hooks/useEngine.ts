"use client";

import { useEffect, useState } from "react";
import { getEngine, type Analysis } from "@/lib/engine";

export type EngineStatus = "off" | "loading" | "running" | "error";

/**
 * 켜져 있으면 위치가 바뀔 때마다 Stockfish로 분석합니다.
 */
export function useEngine(
  fen: string,
  enabled: boolean,
  { depth = 20, multiPv = 3 } = {},
): { analysis: Analysis | null; status: EngineStatus } {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<EngineStatus>("off");

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      setAnalysis(null);
      return;
    }
    const engine = getEngine();
    let cancelled = false;
    setStatus((current) => (current === "off" ? "loading" : current));
    setAnalysis(null);
    engine
      .analyze(
        fen,
        (result) => {
          if (cancelled) return;
          setStatus("running");
          setAnalysis(result);
        },
        { depth, multiPv },
      )
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [fen, enabled, depth, multiPv]);

  // 끄거나 페이지를 떠나면 분석 멈춤
  useEffect(() => {
    if (!enabled) return;
    return () => getEngine().stop();
  }, [enabled]);

  return { analysis, status };
}
