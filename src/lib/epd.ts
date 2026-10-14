/**
 * FEN에서 수 카운터를 뺀 EPD(기물 배치, 차례, 캐슬링, 앙파상)를 반환합니다.
 * 같은 위치라도 수 순서에 따라 카운터가 달라지므로 오프닝 조회 키로 EPD를 사용합니다.
 */
export const fenToEpd = (fen: string): string =>
  fen.split(" ").slice(0, 4).join(" ");
