/**
 * FEN에서 수 카운터를 뺀 EPD(기물 배치, 차례, 캐슬링, 앙파상)를 반환합니다.
 * 같은 위치라도 수 순서에 따라 카운터가 달라지므로 오프닝 조회 키로 EPD를 사용합니다.
 */
export const fenToEpd = (fen: string): string =>
  fen.split(" ").slice(0, 4).join(" ");

/**
 * 문자열의 53비트 해시(cyrb53)를 36진수 문자열로 반환합니다.
 * 오프닝 데이터(약 8천 개 위치)에서 충돌 확률이 사실상 0이라 EPD 대신 조회 키로 씁니다.
 */
const cyrb53 = (text: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};

/** FEN(또는 EPD)이 가리키는 위치의 조회 키 */
export const positionKey = (fen: string): string => cyrb53(fenToEpd(fen));
