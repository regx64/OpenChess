/**
 * 오프닝 추천에 쓰는 해설 문서별 성격.
 * - role: 백 레퍼토리 / 흑으로 1. e4 상대 / 흑으로 1. d4 상대
 * - style: sharp(날카롭고 공격적) / balanced(균형) / solid(견고·안정)
 * - theory: 외워야 할 이론의 양 1(적음)–3(많음)
 * - level: 권장 수준 1(입문)–3(고급)
 */
export type Role = "white" | "black-e4" | "black-d4";
export type Style = "sharp" | "balanced" | "solid";

export interface OpeningProfile {
  slug: string;
  role: Role;
  style: Style;
  theory: 1 | 2 | 3;
  level: 1 | 2 | 3;
  /** 추천 이유 한 줄 */
  why: string;
}

export const OPENING_PROFILES: OpeningProfile[] = [
  // 백
  {
    slug: "italian-game",
    role: "white",
    style: "balanced",
    theory: 2,
    level: 1,
    why: "빠른 전개와 중앙 장악이라는 오프닝 원칙을 그대로 익힐 수 있습니다.",
  },
  {
    slug: "italian-game-evans-gambit",
    role: "white",
    style: "sharp",
    theory: 2,
    level: 2,
    why: "폰 하나를 내주고 빠른 전개와 공격 주도권을 얻습니다.",
  },
  {
    slug: "ruy-lopez",
    role: "white",
    style: "balanced",
    theory: 3,
    level: 2,
    why: "가장 깊이 있는 1. e4 e5 오프닝으로, 오래 두며 성장할 수 있습니다.",
  },
  {
    slug: "scotch-game",
    role: "white",
    style: "balanced",
    theory: 2,
    level: 1,
    why: "일찍 중앙을 열어 기물이 활발해지고, 이론이 비교적 명확합니다.",
  },
  {
    slug: "kings-gambit",
    role: "white",
    style: "sharp",
    theory: 2,
    level: 1,
    why: "f폰을 내주고 킹사이드를 공격하는 낭만적인 오프닝입니다.",
  },
  {
    slug: "vienna-game",
    role: "white",
    style: "sharp",
    theory: 1,
    level: 1,
    why: "Nc3 뒤 f4로 공격하는 체계로, 외울 이론이 적습니다.",
  },
  {
    slug: "four-knights-game",
    role: "white",
    style: "solid",
    theory: 1,
    level: 1,
    why: "대칭적이고 안전한 전개로 실수할 여지가 적습니다.",
  },
  {
    slug: "london-system",
    role: "white",
    style: "solid",
    theory: 1,
    level: 1,
    why: "상대 수와 상관없이 같은 배치를 두는 체계라 이론 부담이 가장 적습니다.",
  },
  {
    slug: "catalan-opening",
    role: "white",
    style: "balanced",
    theory: 3,
    level: 3,
    why: "g2 비숍으로 오래 압박하는 포지셔널 오프닝으로, 최상위에서도 쓰입니다.",
  },
  {
    slug: "trompowsky-attack",
    role: "white",
    style: "sharp",
    theory: 1,
    level: 2,
    why: "2. Bg5로 일찍 상대를 이론 밖으로 끌어냅니다.",
  },
  {
    slug: "english-opening",
    role: "white",
    style: "balanced",
    theory: 2,
    level: 2,
    why: "유연한 플랭크 오프닝으로, 다양한 구조를 경험할 수 있습니다.",
  },
  {
    slug: "reti-opening",
    role: "white",
    style: "solid",
    theory: 2,
    level: 2,
    why: "하이퍼모던 방식으로 중앙을 멀리서 통제합니다.",
  },
  {
    slug: "kings-indian-attack",
    role: "white",
    style: "solid",
    theory: 1,
    level: 1,
    why: "같은 배치로 대부분의 수비에 대응하는 체계입니다.",
  },
  {
    slug: "bird-opening",
    role: "white",
    style: "sharp",
    theory: 1,
    level: 2,
    why: "1. f4로 e5 칸을 장악하는 드문 오프닝이라 상대가 준비하기 어렵습니다.",
  },
  // 흑 vs 1. e4
  {
    slug: "sicilian-defense",
    role: "black-e4",
    style: "sharp",
    theory: 3,
    level: 2,
    why: "1. e4에 대한 가장 공격적이고 인기 있는 수비입니다.",
  },
  {
    slug: "sicilian-defense-najdorf-variation",
    role: "black-e4",
    style: "sharp",
    theory: 3,
    level: 3,
    why: "피셔와 카스파로프의 무기. 가장 날카롭고 이론이 깊습니다.",
  },
  {
    slug: "sicilian-defense-dragon-variation",
    role: "black-e4",
    style: "sharp",
    theory: 3,
    level: 3,
    why: "양쪽 킹을 향한 공격 경쟁이 펼쳐지는 화끈한 변형입니다.",
  },
  {
    slug: "french-defense",
    role: "black-e4",
    style: "solid",
    theory: 2,
    level: 1,
    why: "견고한 폰 사슬 뒤에서 반격을 준비하는 전략적 수비입니다.",
  },
  {
    slug: "caro-kann-defense",
    role: "black-e4",
    style: "solid",
    theory: 2,
    level: 1,
    why: "튼튼한 구조와 좋은 비숍을 유지하는 안정적인 수비입니다.",
  },
  {
    slug: "scandinavian-defense",
    role: "black-e4",
    style: "balanced",
    theory: 1,
    level: 1,
    why: "1...d5로 바로 중앙을 맞받아쳐 상대의 준비를 줄입니다.",
  },
  {
    slug: "pirc-defense",
    role: "black-e4",
    style: "sharp",
    theory: 2,
    level: 2,
    why: "중앙을 내주고 나중에 반격하는 하이퍼모던 수비입니다.",
  },
  {
    slug: "modern-defense",
    role: "black-e4",
    style: "sharp",
    theory: 1,
    level: 2,
    why: "유연한 피앙케토 배치로 상대를 낯선 구조로 끌어들입니다.",
  },
  {
    slug: "alekhine-defense",
    role: "black-e4",
    style: "sharp",
    theory: 2,
    level: 2,
    why: "백 폰을 앞으로 유인해 약점으로 만드는 도발적인 수비입니다.",
  },
  {
    slug: "petrovs-defense",
    role: "black-e4",
    style: "solid",
    theory: 2,
    level: 2,
    why: "대칭적이고 무승부성이 강한, 매우 견고한 1...e5 수비입니다.",
  },
  {
    slug: "philidor-defense",
    role: "black-e4",
    style: "solid",
    theory: 1,
    level: 1,
    why: "단단한 d6–e5 구조로 이론 부담 없이 둘 수 있습니다.",
  },
  {
    slug: "italian-game-two-knights-defense",
    role: "black-e4",
    style: "sharp",
    theory: 2,
    level: 1,
    why: "이탈리안 게임에 대해 3...Nf6으로 바로 반격하는 활발한 수비입니다.",
  },
  {
    slug: "ruy-lopez-berlin-defense",
    role: "black-e4",
    style: "solid",
    theory: 3,
    level: 3,
    why: "최상위에서 검증된 가장 견고한 루이 로페즈 수비입니다.",
  },
  // 흑 vs 1. d4
  {
    slug: "queens-gambit-declined",
    role: "black-d4",
    style: "solid",
    theory: 2,
    level: 1,
    why: "고전적이고 건전한 수비로, 중앙을 단단히 지킵니다.",
  },
  {
    slug: "queens-gambit-accepted",
    role: "black-d4",
    style: "balanced",
    theory: 2,
    level: 2,
    why: "폰을 받았다 돌려주며 자유로운 기물 활동을 얻습니다.",
  },
  {
    slug: "slav-defense",
    role: "black-d4",
    style: "solid",
    theory: 2,
    level: 1,
    why: "c6으로 d5를 지키고 c8 비숍을 활발하게 쓰는 견고한 수비입니다.",
  },
  {
    slug: "semi-slav-defense",
    role: "black-d4",
    style: "sharp",
    theory: 3,
    level: 3,
    why: "견고해 보이지만 메란·보트비닉처럼 극도로 날카로운 변형이 많습니다.",
  },
  {
    slug: "tarrasch-defense",
    role: "black-d4",
    style: "balanced",
    theory: 2,
    level: 2,
    why: "고립 폰을 감수하고 활발한 기물 활동을 얻는 능동적인 수비입니다.",
  },
  {
    slug: "kings-indian-defense",
    role: "black-d4",
    style: "sharp",
    theory: 3,
    level: 2,
    why: "중앙을 내주고 킹사이드 공격으로 반격하는 역동적인 수비입니다.",
  },
  {
    slug: "nimzo-indian-defense",
    role: "black-d4",
    style: "balanced",
    theory: 3,
    level: 2,
    why: "Bb4 핀으로 e4를 통제하는, 가장 존경받는 1. d4 수비입니다.",
  },
  {
    slug: "queens-indian-defense",
    role: "black-d4",
    style: "solid",
    theory: 2,
    level: 2,
    why: "b7 비숍으로 대각선을 통제하는 견고한 인디언 수비입니다.",
  },
  {
    slug: "grunfeld-defense",
    role: "black-d4",
    style: "sharp",
    theory: 3,
    level: 3,
    why: "백에게 넓은 중앙을 주고 기물로 공격하는 날카로운 수비입니다.",
  },
  {
    slug: "bogo-indian-defense",
    role: "black-d4",
    style: "solid",
    theory: 1,
    level: 2,
    why: "Bb4+로 간단하게 전개하는, 이론 부담이 적은 수비입니다.",
  },
  {
    slug: "benoni-defense",
    role: "black-d4",
    style: "sharp",
    theory: 2,
    level: 2,
    why: "비대칭 구조에서 퀸사이드 다수 폰으로 반격합니다.",
  },
  {
    slug: "benko-gambit",
    role: "black-d4",
    style: "sharp",
    theory: 2,
    level: 2,
    why: "폰을 내주고 열린 a·b열로 오래가는 압박을 얻습니다.",
  },
  {
    slug: "dutch-defense",
    role: "black-d4",
    style: "sharp",
    theory: 2,
    level: 2,
    why: "1...f5로 e4를 통제하며 킹사이드 공격을 노리는 불균형 수비입니다.",
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  white: "백으로 둘 오프닝",
  "black-e4": "흑으로 1. e4를 상대할 때",
  "black-d4": "흑으로 1. d4를 상대할 때",
};

export const STYLE_LABELS: Record<Style, string> = {
  sharp: "공격적이고 날카로운",
  balanced: "균형 잡힌",
  solid: "견고하고 안정적인",
};

export interface Preferences {
  style: Style;
  /** 1 입문 · 2 중급 · 3 고급 */
  level: 1 | 2 | 3;
  /** 이론을 적게 외우고 싶은지 */
  lowTheory: boolean;
}

/** 취향에 맞는 정도 (높을수록 잘 맞음) */
export function scoreProfile(
  profile: OpeningProfile,
  prefs: Preferences,
): number {
  const styles: Style[] = ["sharp", "balanced", "solid"];
  const styleGap = Math.abs(
    styles.indexOf(profile.style) - styles.indexOf(prefs.style),
  );
  let score = styleGap === 0 ? 6 : styleGap === 1 ? 2 : 0;
  if (prefs.lowTheory) score += (3 - profile.theory) * 2;
  else if (prefs.level === 3) score += profile.theory - 1; // 고급이면 깊은 이론도 장점
  if (profile.level > prefs.level) score -= (profile.level - prefs.level) * 3;
  else if (profile.level === prefs.level) score += 1;
  return score;
}

/** 역할별 추천 순위 */
export function recommend(
  prefs: Preferences,
  count = 3,
): Record<Role, OpeningProfile[]> {
  const result = {} as Record<Role, OpeningProfile[]>;
  for (const role of Object.keys(ROLE_LABELS) as Role[]) {
    result[role] = OPENING_PROFILES.filter((p) => p.role === role)
      .map((p) => ({ p, score: scoreProfile(p, prefs) }))
      .sort((a, b) => b.score - a.score || a.p.theory - b.p.theory)
      .slice(0, count)
      .map(({ p }) => p);
  }
  return result;
}
