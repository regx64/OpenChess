import type { CatalogEntry, OpeningBook } from "@/lib/openingBook";

export type EcoVolume = "A" | "B" | "C" | "D" | "E";

/** ECO 다섯 권의 범위 설명 */
export const ECO_VOLUMES: Record<
  EcoVolume,
  { title: string; description: string }
> = {
  A: {
    title: "플랭크 오프닝과 1. d4 비정형 수비",
    description:
      "1. e4·1. d4가 아닌 첫 수(잉글리시, 레티, 버드, 라르센 등)와, 1. d4에 대해 1...d5나 2. c4 e6/g6 체계가 아닌 수비(트롬포프스키, 런던, 부다페스트, 올드 인디언, 베노니, 벤코, 더치 등)를 모았습니다.",
  },
  B: {
    title: "반개방 게임",
    description:
      "1. e4에 흑이 1...e5·1...e6 이외의 수로 응수하는 오프닝입니다. 시실리안(B20–B99)이 가장 큰 비중을 차지하고, 카로칸, 피르츠, 모던, 알레힌, 스칸디나비안이 여기에 속합니다.",
  },
  C: {
    title: "개방 게임과 프렌치",
    description:
      "프렌치 디펜스(1. e4 e6, C00–C19)와 1. e4 e5로 시작하는 모든 오프닝(C20–C99)입니다. 이탈리안, 루이 로페즈, 스카치, 킹스 갬빗, 페트로프, 비엔나 등이 있습니다.",
  },
  D: {
    title: "폐쇄 게임과 그륀펠트",
    description:
      "1. d4 d5로 시작하는 오프닝(D00–D69: 퀸즈 갬빗, 슬라브, 세미 슬라브 등)과 그륀펠트·네오 그륀펠트(D70–D99)입니다.",
  },
  E: {
    title: "인디언 디펜스",
    description:
      "1. d4 Nf6 2. c4 뒤 흑이 e6이나 g6을 두는 체계입니다. 카탈란, 보고인디언, 퀸즈 인디언, 님조인디언(E00–E59)과 킹스 인디언(E60–E99)이 여기에 속합니다.",
  },
};

export const ECO_VOLUME_KEYS = Object.keys(ECO_VOLUMES) as EcoVolume[];

export interface EcoCode {
  code: string;
  /** 이 코드에서 가장 많이 나오는 오프닝 계열 (이름의 ":" 앞부분) */
  family: string;
  entries: CatalogEntry[];
}

/** 권별로 코드(A00…A99)마다 오프닝을 모읍니다. 데이터에 없는 코드는 빠집니다. */
export function ecoCodes(book: OpeningBook, volume: EcoVolume): EcoCode[] {
  const byCode = new Map<string, CatalogEntry[]>();
  for (const entry of book.catalog()) {
    if (entry.eco[0] !== volume) continue;
    byCode.set(entry.eco, [...(byCode.get(entry.eco) ?? []), entry]);
  }
  return [...byCode.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, entries]) => {
      const counts = new Map<string, number>();
      for (const entry of entries) {
        const family = entry.name.split(":")[0];
        counts.set(family, (counts.get(family) ?? 0) + 1);
      }
      const family = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return {
        code,
        family,
        entries: entries.sort(
          (a, b) => a.plies - b.plies || a.name.localeCompare(b.name),
        ),
      };
    });
}
