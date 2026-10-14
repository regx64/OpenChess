/**
 * 학습 코스: "해설 읽기 → 트레이너 → 함정·퍼즐·명국 → 퀴즈" 순서로 오프닝 하나(또는 레퍼토리 한 쪽)를 익힙니다.
 * 각 단계의 완료 여부는 학습 기록에서 자동으로 판단하고, 판단할 수 없는 단계는 직접 체크합니다.
 */
export type StepKind = "doc" | "drill" | "trap" | "puzzles" | "game" | "quiz";

export interface CourseStep {
  kind: StepKind;
  title: string;
  /** doc: 문서 slug / drill: 오프닝 영문 이름 / trap: 함정 id / puzzles: 오프닝 계열 이름 / game: 명국 id */
  target?: string;
  /** drill에서 연습할 색 */
  color?: "w" | "b";
}

export interface Course {
  id: string;
  title: string;
  level: "입문" | "중급" | "고급";
  description: string;
  steps: CourseStep[];
}

export const COURSES: Course[] = [
  {
    id: "first-opening",
    title: "첫 오프닝: 1. e4 e5와 이탈리안 게임",
    level: "입문",
    description:
      "빠른 전개, 중앙 장악, 캐슬링이라는 오프닝 원칙을 가장 고전적인 오프닝으로 익힙니다. 초반 함정도 함께 배웁니다.",
    steps: [
      { kind: "doc", title: "이탈리안 게임 해설 읽기", target: "italian-game" },
      {
        kind: "drill",
        title: "백으로 이탈리안 게임 연습",
        target: "Italian Game",
        color: "w",
      },
      {
        kind: "trap",
        title: "함정: 학자의 메이트 걸고 피하기",
        target: "scholars-mate",
      },
      { kind: "trap", title: "함정: 레갈의 메이트", target: "legals-mate" },
      { kind: "game", title: "명국: 오페라 게임 감상", target: "opera-game" },
      {
        kind: "doc",
        title: "흑의 반격: 투 나이츠 디펜스 해설",
        target: "italian-game-two-knights-defense",
      },
      {
        kind: "drill",
        title: "흑으로 투 나이츠 디펜스 연습",
        target: "Italian Game: Two Knights Defense",
        color: "b",
      },
      {
        kind: "puzzles",
        title: "이탈리안 게임 퍼즐 5개",
        target: "Italian Game",
      },
      { kind: "quiz", title: "퀴즈(기본)로 복습" },
    ],
  },
  {
    id: "white-e4",
    title: "백 1. e4 레퍼토리",
    level: "중급",
    description:
      "1. e4를 두면 만나는 주요 수비(1...e5, 시실리안, 프렌치, 카로칸)에 대한 백의 대응을 차례로 준비합니다.",
    steps: [
      { kind: "doc", title: "루이 로페즈 해설 읽기", target: "ruy-lopez" },
      {
        kind: "drill",
        title: "백으로 루이 로페즈 연습",
        target: "Ruy Lopez",
        color: "w",
      },
      {
        kind: "doc",
        title: "시실리안 디펜스 해설 읽기",
        target: "sicilian-defense",
      },
      {
        kind: "drill",
        title: "백으로 시실리안 상대하기",
        target: "Sicilian Defense",
        color: "w",
      },
      {
        kind: "drill",
        title: "백으로 프렌치 상대하기",
        target: "French Defense",
        color: "w",
      },
      {
        kind: "drill",
        title: "백으로 카로칸 상대하기",
        target: "Caro-Kann Defense",
        color: "w",
      },
      {
        kind: "trap",
        title: "함정: 노아의 방주 (피하기)",
        target: "noahs-ark",
      },
      { kind: "game", title: "명국: 불멸의 게임", target: "immortal-game" },
      { kind: "quiz", title: "퀴즈(보통)로 복습" },
    ],
  },
  {
    id: "caro-kann",
    title: "흑: 1. e4에 카로칸",
    level: "입문",
    description:
      "튼튼한 구조로 1. e4를 상대하는 카로칸 디펜스를 처음부터 익힙니다.",
    steps: [
      {
        kind: "doc",
        title: "카로칸 디펜스 해설 읽기",
        target: "caro-kann-defense",
      },
      {
        kind: "drill",
        title: "흑으로 카로칸 연습",
        target: "Caro-Kann Defense",
        color: "b",
      },
      {
        kind: "trap",
        title: "함정: 카로칸 스머더드 메이트 피하기",
        target: "caro-kann-smothered",
      },
      {
        kind: "puzzles",
        title: "카로칸 퍼즐 5개",
        target: "Caro-Kann Defense",
      },
      { kind: "quiz", title: "퀴즈로 복습" },
    ],
  },
  {
    id: "sicilian",
    title: "흑: 시실리안 디펜스와 나이도르프",
    level: "고급",
    description:
      "1. e4에 대한 가장 날카로운 수비. 오픈 시실리안의 구조부터 나이도르프·드래곤까지.",
    steps: [
      {
        kind: "doc",
        title: "시실리안 디펜스 해설 읽기",
        target: "sicilian-defense",
      },
      {
        kind: "drill",
        title: "흑으로 시실리안 연습",
        target: "Sicilian Defense",
        color: "b",
      },
      {
        kind: "doc",
        title: "나이도르프 변형 해설 읽기",
        target: "sicilian-defense-najdorf-variation",
      },
      {
        kind: "drill",
        title: "흑으로 나이도르프 연습",
        target: "Sicilian Defense: Najdorf Variation",
        color: "b",
      },
      {
        kind: "doc",
        title: "드래곤 변형 해설 읽기",
        target: "sicilian-defense-dragon-variation",
      },
      { kind: "trap", title: "함정: 시베리안 트랩", target: "siberian-trap" },
      {
        kind: "puzzles",
        title: "시실리안 퍼즐 5개",
        target: "Sicilian Defense",
      },
      { kind: "quiz", title: "퀴즈(보통)로 복습" },
    ],
  },
  {
    id: "london",
    title: "1. d4 체계: 런던 시스템",
    level: "입문",
    description:
      "상대 수와 상관없이 같은 배치를 두는 런던 시스템으로 이론 부담 없이 1. d4를 둡니다.",
    steps: [
      { kind: "doc", title: "런던 시스템 해설 읽기", target: "london-system" },
      {
        kind: "drill",
        title: "백으로 런던 시스템 연습",
        target: "Queen's Pawn Game: London System",
        color: "w",
      },
      {
        kind: "puzzles",
        title: "퀸즈 폰 게임 퍼즐 5개",
        target: "Queen's Pawn Game",
      },
      { kind: "quiz", title: "퀴즈로 복습" },
    ],
  },
  {
    id: "black-d4-classical",
    title: "흑: 1. d4에 퀸즈 갬빗 거절과 슬라브",
    level: "중급",
    description: "1...d5로 중앙을 지키는 고전적인 두 수비를 익힙니다.",
    steps: [
      {
        kind: "doc",
        title: "퀸즈 갬빗 거절 해설 읽기",
        target: "queens-gambit-declined",
      },
      {
        kind: "drill",
        title: "흑으로 퀸즈 갬빗 거절 연습",
        target: "Queen's Gambit Declined",
        color: "b",
      },
      { kind: "trap", title: "함정: 엘리펀트 트랩", target: "elephant-trap" },
      { kind: "doc", title: "슬라브 디펜스 해설 읽기", target: "slav-defense" },
      {
        kind: "drill",
        title: "흑으로 슬라브 연습",
        target: "Slav Defense",
        color: "b",
      },
      { kind: "trap", title: "함정: 라스커 트랩", target: "lasker-trap" },
      { kind: "quiz", title: "퀴즈(보통)로 복습" },
    ],
  },
  {
    id: "indian-defenses",
    title: "흑: 인디언 디펜스",
    level: "고급",
    description:
      "1. d4 Nf6 2. c4 이후의 인디언 체계: 님조인디언, 퀸즈 인디언, 킹스 인디언, 그륀펠트.",
    steps: [
      {
        kind: "doc",
        title: "님조인디언 해설 읽기",
        target: "nimzo-indian-defense",
      },
      {
        kind: "drill",
        title: "흑으로 님조인디언 연습",
        target: "Nimzo-Indian Defense",
        color: "b",
      },
      {
        kind: "doc",
        title: "킹스 인디언 해설 읽기",
        target: "kings-indian-defense",
      },
      {
        kind: "drill",
        title: "흑으로 킹스 인디언 연습",
        target: "King's Indian Defense",
        color: "b",
      },
      { kind: "doc", title: "그륀펠트 해설 읽기", target: "grunfeld-defense" },
      {
        kind: "game",
        title: "명국: 세기의 대국",
        target: "game-of-the-century",
      },
      {
        kind: "trap",
        title: "함정: 키닝거 트랩 (부다페스트)",
        target: "kieninger-trap",
      },
      { kind: "quiz", title: "퀴즈(보통)로 복습" },
    ],
  },
];
