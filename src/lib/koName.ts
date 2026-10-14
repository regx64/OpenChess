import terms from "@/data/ko-terms.json";

/**
 * 오프닝 영문 이름을 한국어 표기로 바꿉니다 (단어별 음역·번역, 영어 어순 유지).
 * 예: "Sicilian Defense: Najdorf Variation, English Attack"
 *   → "시실리안 디펜스: 나이도르프 변형, 잉글리시 어택"
 * 사전(src/data/ko-terms.json)에 없는 단어는 영어 그대로 둡니다.
 */
const dictionary = terms as Record<string, string>;

/** 여러 단어로 된 표현은 긴 것부터 먼저 맞춤 */
const maxPhraseWords = Math.max(
  1,
  ...Object.keys(dictionary).map((key) => key.split(" ").length),
);

const cache = new Map<string, string>();

export function koreanName(name: string): string {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  // 구분자(공백, ":", ",")를 살려 두고 단어만 바꿈
  const tokens = name.split(/(\s+|:|,)/);
  const out: string[] = [];
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i];
    if (!token || /^(\s+|:|,)$/.test(token)) {
      out.push(token);
      i++;
      continue;
    }
    let matched = false;
    // 단어 사이 구분자가 공백 하나인 경우만 구절로 봄
    for (let words = maxPhraseWords; words > 1 && !matched; words--) {
      const parts: string[] = [];
      let j = i;
      for (let w = 0; w < words && j < tokens.length; w++) {
        parts.push(tokens[j]);
        if (w < words - 1) {
          if (tokens[j + 1] !== " ") break;
          j += 2;
        }
      }
      if (parts.length !== words) continue;
      const phrase = parts.join(" ");
      if (dictionary[phrase]) {
        out.push(dictionary[phrase]);
        i = i + (words - 1) * 2 + 1;
        matched = true;
      }
    }
    if (!matched) {
      out.push(dictionary[token] ?? token);
      i++;
    }
  }
  const result = out.join("");
  cache.set(name, result);
  return result;
}
