import "server-only";
import openings from "@/data/openings.json";
import { fenToEpd } from "@/lib/epd";
import type { OpeningInfo } from "@/types/chess";

// [eco, name] 형태로 저장됨 (bin/build-openings.ts 참고)
const book: Record<string, string[]> = openings;

/**
 * FEN 위치 배열에서 처음으로 이름이 알려진 오프닝을 찾습니다
 * @param fens - 확인할 FEN 위치 배열 (우선순위 순서)
 * @returns 오프닝 정보와 일치한 위치의 인덱스, 없으면 null
 */
export function lookupOpening(
  fens: string[],
): { opening: OpeningInfo; index: number } | null {
  for (const [index, fen] of fens.entries()) {
    const entry = book[fenToEpd(fen)];
    if (entry) {
      const [eco, name] = entry;
      return { opening: { eco, name }, index };
    }
  }
  return null;
}
