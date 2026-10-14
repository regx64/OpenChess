/** 문서의 한 절과 그 절에서 다루는 수순들 (SAN을 공백으로 이은 문자열) */
export interface DocSection {
  slug: string;
  heading: string;
  anchor: string;
  lines: string[];
}

export interface DocSectionMatch {
  section: DocSection;
  /** 지금 수순이 그 절의 수순을 이미 지나쳤는지(true) 아직 그 앞인지(false) */
  reached: boolean;
}

/**
 * 지금까지 둔 수순(SAN 목록)을 가장 구체적으로 다루는 문서 절을 찾습니다.
 * - 절의 수순이 지금 수순과 앞부분이 완전히 같아야 함 (한쪽이 다른 쪽의 앞부분)
 * - 겹치는 길이가 길수록, 절 제목에 마지막 수가 나올수록, 절의 수순이 짧을수록 우선
 */
export function findDocSection(
  sections: DocSection[],
  sans: string[],
  /** 이 문서들 중에서만 찾기 (없으면 전체) */
  slugs?: string[],
  /** 이미 지나온 수순만 (앞으로 이어질 수순은 여러 오프닝으로 갈라지므로 문서를 정하지 못했을 때 사용) */
  reachedOnly = false,
): DocSectionMatch | null {
  if (!sans.length) return null;
  const last = sans[sans.length - 1].replace(/[+#]/g, "");
  let best: { match: DocSectionMatch; key: [number, number, number] } | null =
    null;

  for (const section of sections) {
    if (slugs && !slugs.includes(section.slug)) continue;
    const mentions = section.heading.includes(last) ? 1 : 0;
    for (const text of section.lines) {
      const line = text.split(" ");
      const common = Math.min(line.length, sans.length);
      let same = true;
      for (let i = 0; i < common; i++) {
        if (line[i] !== sans[i]) {
          same = false;
          break;
        }
      }
      // 너무 일반적인 수순(첫 두 수 이하)은 다른 오프닝과 겹치므로 제외
      if (!same || common < 2) continue;
      if (reachedOnly && line.length > sans.length) continue;
      const key: [number, number, number] = [common, mentions, -line.length];
      if (
        !best ||
        key[0] > best.key[0] ||
        (key[0] === best.key[0] &&
          (key[1] > best.key[1] ||
            (key[1] === best.key[1] && key[2] > best.key[2])))
      ) {
        best = { match: { section, reached: line.length <= sans.length }, key };
      }
    }
  }
  return best?.match ?? null;
}
