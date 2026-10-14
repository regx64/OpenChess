/** 화면에서 쓰는 오프닝 문서 요약 (서버에서 frontmatter를 읽어 클라이언트로 넘김) */
export interface DocRef {
  slug: string;
  /** 한국어 이름 */
  title: string;
  /** 데이터셋 영문 이름 */
  name: string;
  aliases: string[];
  eco: string;
  group: string;
  summary: string;
  pgn: string;
}

/**
 * 데이터셋 오프닝 이름에 해당하는 한국어 문서를 찾습니다.
 * 이름(또는 별칭)이 정확히 같거나, 그 이름의 하위 변형("이름: ...", "이름, ...")이면 가장 구체적인 문서를 고릅니다.
 * 예: "Sicilian Defense: Najdorf Variation, English Attack" → 시실리안 디펜스: 나이도르프 변형 문서
 */
export function findDocForName(docs: DocRef[], name: string): DocRef | null {
  let best: { doc: DocRef; length: number } | null = null;
  for (const doc of docs) {
    for (const key of [doc.name, ...doc.aliases]) {
      const matches =
        name === key ||
        name.startsWith(`${key}:`) ||
        name.startsWith(`${key},`);
      if (matches && (!best || key.length > best.length)) {
        best = { doc, length: key.length };
      }
    }
  }
  return best?.doc ?? null;
}
