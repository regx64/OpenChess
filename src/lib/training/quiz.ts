import type { CatalogEntry, OpeningBook } from "@/lib/openingBook";

export type QuizMode = "position" | "moves" | "eco";
export type QuizLevel = "basic" | "normal" | "all";

export const QUIZ_MODES: {
  id: QuizMode;
  label: string;
  description: string;
}[] = [
  {
    id: "position",
    label: "장면 → 이름",
    description: "보드의 장면을 보고 오프닝 이름을 고르세요.",
  },
  {
    id: "moves",
    label: "이름 → 수순",
    description: "오프닝 이름을 보고 그 수순을 직접 두세요.",
  },
  {
    id: "eco",
    label: "수순 → ECO",
    description: "수순을 보고 ECO 코드를 고르세요.",
  },
];

export const QUIZ_LEVELS: { id: QuizLevel; label: string }[] = [
  { id: "basic", label: "기본 (해설 문서가 있는 오프닝)" },
  { id: "normal", label: "보통 (14수 이내 주요 오프닝)" },
  { id: "all", label: "전체 (3,177개 모두)" },
];

type Random = () => number;

const shuffle = <T>(items: T[], random: Random): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const family = (name: string) => name.split(":")[0];

/** 난이도별 문제 후보 */
export function quizPool(
  book: OpeningBook,
  level: QuizLevel,
  hasDoc: (name: string) => boolean,
): CatalogEntry[] {
  const catalog = book.catalog();
  if (level === "all") return catalog;
  if (level === "basic")
    return catalog.filter((entry) => entry.plies <= 12 && hasDoc(entry.name));
  return catalog.filter(
    (entry) => entry.plies <= 14 && book.lineCount[entry.node] >= 2,
  );
}

/** 정답과 헷갈리게 비슷하지만 정답이 될 수는 없는 이름인지 */
function isDistinct(
  book: OpeningBook,
  answer: CatalogEntry,
  other: CatalogEntry,
): boolean {
  if (other.name === answer.name) return false;
  // 상위·하위 오프닝은 같은 장면에 대해 둘 다 맞는 말이 될 수 있으므로 제외
  if (answer.name.startsWith(other.name) || other.name.startsWith(answer.name))
    return false;
  // 같은 위치에 붙은 다른 이름도 제외
  return book.key[other.node] !== book.key[answer.node];
}

/** 이름 고르기 보기 4개 (정답 포함, 섞음): 같은 계열 → 같은 ECO 권 → 나머지 순으로 오답을 고름 */
export function nameChoices(
  book: OpeningBook,
  answer: CatalogEntry,
  pool: CatalogEntry[],
  random: Random = Math.random,
  count = 4,
): CatalogEntry[] {
  const candidates = pool.filter((entry) => isDistinct(book, answer, entry));
  const sameFamily = shuffle(
    candidates.filter((entry) => family(entry.name) === family(answer.name)),
    random,
  );
  const sameVolume = shuffle(
    candidates.filter(
      (entry) =>
        entry.eco[0] === answer.eco[0] &&
        family(entry.name) !== family(answer.name),
    ),
    random,
  );
  const rest = shuffle(candidates, random);
  const picked: CatalogEntry[] = [];
  for (const entry of [...sameFamily.slice(0, 2), ...sameVolume, ...rest]) {
    if (picked.length >= count - 1) break;
    if (
      !picked.some((p) => p.name === entry.name || !isDistinct(book, p, entry))
    )
      picked.push(entry);
  }
  return shuffle([answer, ...picked], random);
}

/** ECO 고르기 보기 4개: 같은 권에서 가까운 코드 중 데이터에 있는 것 */
export function ecoChoices(
  answer: string,
  existing: string[],
  random: Random = Math.random,
): string[] {
  const number = Number(answer.slice(1));
  const sameVolume = existing.filter(
    (code) => code[0] === answer[0] && code !== answer,
  );
  const near = shuffle(
    sameVolume.filter((code) => Math.abs(Number(code.slice(1)) - number) <= 10),
    random,
  );
  const far = shuffle(sameVolume, random);
  const picked = [...new Set([...near, ...far])].slice(0, 3);
  return shuffle([answer, ...picked], random);
}

/** 후보 중 하나를 뽑되, 최근에 낸 문제는 피함 */
export function pickQuestion(
  pool: CatalogEntry[],
  recent: string[],
  random: Random = Math.random,
): CatalogEntry {
  const fresh = pool.filter((entry) => !recent.includes(entry.name));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(random() * from.length)];
}
