import type { OpeningInfo } from "@/types/chess";

/**
 * 오프닝 데이터셋에서 FEN 위치 배열 중 처음으로 이름이 알려진 오프닝을 찾습니다
 * @param fens - 확인할 FEN 위치 배열 (우선순위 순서, 보통 최신부터 과거)
 * @param signal - 요청 취소용 AbortSignal
 * @returns 오프닝 정보와 일치한 위치의 인덱스 (없으면 opening: null, index: -1)
 */
export const fetchOpening = async (
  fens: string[],
  signal?: AbortSignal,
): Promise<{ opening: OpeningInfo | null; index: number }> => {
  const response = await fetch("/api/opening", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fens }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
