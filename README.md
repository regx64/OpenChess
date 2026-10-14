<p align="center">
  <img style="height:150px;" src="public/logo.png">
</p>

<h1 align="center">OpenChess</h1>

## 🚀 소개

**모든 체스 오프닝을 정복할 수 있게 돕는** 오프닝 학습 앱입니다. 이름이 붙은 오프닝 3,177개를 모두 **찾고 → 이해하고 → 익히고 → 내 것으로 만들고 → 정복도를 추적**할 수 있습니다. 모바일에서도 그대로 쓸 수 있고, 홈 화면에 설치해 인터넷 없이도 쓸 수 있습니다.

DB나 로그인 없이 동작하며, 학습 기록·레퍼토리·설정은 모두 브라우저에 저장됩니다(백업 파일로 내보내기·되살리기 가능).

### 찾기

- **분석 보드**: 드래그·터치·클릭으로 두기, 보드 뒤집기, 승격 선택, 변화수 트리, 키보드·스와이프 이동, PGN(변화수·주석 포함)·FEN 불러오기와 내보내기
- **오프닝 판별**: 지금 위치의 오프닝, 이론을 벗어난 수, 트랜스포지션 안내, 지금 수순을 다루는 해설 절로 바로 연결
- **오프닝 탐색기**: 지금 위치에서 둘 수 있는 이론 수와 이어지는 오프닝, 보드 위 화살표
- **모든 오프닝 페이지**: 3,177개 모두 한국어 이름, 대표 수순 보드, 상위·하위 변형, 같은 오프닝에 도달하는 다른 수순
- **한국어 해설 41개**: 본문의 수순을 누르면 옆(모바일은 아래) 보드에서 바로 재생
- **오프닝 계보**, **ECO 분류(A00–E99)**, **오프닝 비교**
- **스마트 검색**: 한국어, 초성(`ㅅㅅㄹㅇ`), 영문(오타 허용), ECO(`B90`), 수순(`e4 c5 Nf3`)

### 익히기

- **오프닝 트레이너**: 상대 수는 자동, 내 수를 맞히기. 결과에 따라 **간격 반복(SRS)** 복습 일정
- **퀴즈**: 장면 → 이름, 이름 → 수순, 수순 → ECO
- **함정 모음**: 검증된 오프닝 함정 14개를 걸고 피하는 연습
- **오프닝별 퍼즐**: Lichess 퍼즐 5,026개를 오프닝·전술별로, 퍼즐 레이팅
- **명국 감상**: 오페라 게임, 불멸의 게임, 세기의 대국 등

### 내 것으로

- **레퍼토리 빌더**: 백·흑 레퍼토리를 수순 트리로 만들고, 준비 안 된 상대 수(구멍)를 찾아 채우고, 트레이너로 연습
- **내 기보 분석**: 내 대국 PGN에서 오프닝별 성적, 이론 이탈 지점, 레퍼토리와 다른 수
- **Stockfish 엔진**: 평가 막대, 상위 후보 수순, 최선 수 화살표 (브라우저 안에서 실행)
- **주석**: 수 평가 기호, 수별 메모, 화살표·원(PGN `[%cal]`/`[%csl]`), 오프닝별 내 메모
- **오프닝 추천**과 **학습 코스**(입문~고급 7개)

### 정복도 추적

- **정복 현황**: 본 것·익힌 것·마스터한 오프닝 수, 칭호, ECO 히트맵, 계열별 진도, 활동 달력, 다음 목표
- **백업·복원**, **오프라인 준비**, **홈 화면 설치(PWA)**

## 🛠️ 기술 스택

| **분류**    | **스택**                                          |
| :---------: | :-----------------------------------------------: |
| 프레임워크  | `Next.js 16` (App Router), `React 19`, `TypeScript` |
| 스타일      | `Tailwind CSS 4`                                  |
| 체스 규칙   | `chess.js`                                        |
| 콘텐츠      | `MDX` (`openings/`)                               |
| 엔진        | `Stockfish 18` (WASM, Web Worker)                 |
| 테스트      | `bun test`, Playwright(수동 브라우저 확인)         |

## 📁 폴더 구조

```
openings/                 # 한국어 오프닝 해설 (MDX)
public/
├── data/puzzles.json     # 오프닝별 퍼즐 (bin/build-puzzles.ts로 생성)
├── engine/               # Stockfish WASM (GPL-3, 별도 프로그램)
├── pieces/, icons/       # 기물 그림, 앱 아이콘
└── sw.js                 # 오프라인용 서비스 워커
src/
├── app/                  # 페이지 (보드, openings, train, repertoire, my-games, progress …)
├── components/
│   ├── board/            # 보드(Board), 수순 보기(LineViewer)
│   ├── analysis/         # 분석 보드, 수순 목록, 탐색기, 엔진, 주석
│   ├── openings/         # 오프닝 페이지·계보·비교·문서 보드
│   ├── training/         # 트레이너, 퀴즈, 함정, 퍼즐
│   ├── repertoire/, mygames/, recommend/, courses/, progress/
│   └── layout/, settings/, ui/
├── data/
│   ├── opening-tree.json # Lichess 오프닝 데이터셋 수순 트리 (bin/build-openings.ts로 생성)
│   ├── ko-terms.json     # 오프닝 이름 한국어 표기 사전
│   ├── traps.ts, games.ts, courses.ts, recommendations.ts
├── hooks/                # useGameTree, useOpeningBook, useLineDrill, useEngine …
└── lib/
    ├── game/             # 수순 트리·PGN, 게임 상태 판정
    ├── training/         # 간격 반복, 연습 목록, 퀴즈, 진도
    ├── openingBook.ts    # 오프닝 판별·탐색 (위치 해시 기반)
    ├── search.ts         # 스마트 검색
    ├── engine.ts         # Stockfish UCI 래퍼
    ├── repertoire.ts     # 구멍 찾기
    ├── gameAnalysis.ts   # 기보 분석
    └── storage.ts        # 브라우저 저장소·백업
```

## 💻 실행 방법

```bash
bun install          # 또는 npm install
bun run dev          # 개발 서버
bun run build        # 프로덕션 빌드
bun run start        # 빌드 결과 실행
```

환경 변수나 데이터베이스는 필요 없습니다.

### 검사

```bash
bun run type-check       # 타입 검사
bun run test             # 단위 테스트 (수순 트리, PGN, 검색, 간격 반복, 함정·명국 검증 등)
bun run openings:check   # 해설 문서의 frontmatter와 모든 수순 검사
```

### 데이터 다시 만들기

```bash
bun run openings:build   # Lichess 오프닝 데이터셋 → src/data/opening-tree.json

# 퍼즐 (zstd 필요)
curl -s https://database.lichess.org/lichess_db_puzzle.csv.zst | zstd -dc | head -n 400000 > puzzles.csv
bun run bin/build-puzzles.ts puzzles.csv
```

## 📚 오프닝 문서 추가하기

`openings/` 폴더에 `.mdx` 파일을 추가하면 `/openings/<파일 이름>` 페이지가 생깁니다. 파일 이름은 Lichess 오프닝 이름을 소문자로 바꾸고 띄어쓰기를 `-`로 바꾼 형태입니다 (예: `Queen's Gambit Declined` → `queens-gambit-declined.mdx`). 문서가 없는 오프닝도 데이터셋으로 페이지가 자동으로 만들어집니다.

```mdx
---
title: 퀸즈 갬빗 거절            # 한국어 이름 (검색에도 사용)
name: "Queen's Gambit Declined"  # 오프닝 데이터셋의 영문 이름
eco: D30
pgn: "1. d4 d5 2. c4 e6"         # 대표 수순
group: "1. d4 d5"                # 목록 분류
summary: 한 줄 요약
aliases:                         # (선택) 같은 문서로 연결할 다른 영문 이름
  - Some Other Name
---

본문... 수순은 `1. d4 d5 2. c4 e6`처럼 인라인 코드로 쓰면 누를 때 문서 옆 보드에서 재생됩니다.
```

문서를 추가하거나 고친 뒤에는 `bun run openings:check`로 frontmatter와 모든 수순이 올바른지 확인하세요.

## 📜 데이터와 라이선스

- 앱 코드: MIT ([LICENSE](LICENSE))
- 오프닝 데이터: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0)
- 퍼즐: [Lichess 퍼즐 데이터베이스](https://database.lichess.org/#puzzles) (CC0)
- 해설 문서: 위키백과·위키북스(CC BY-SA 4.0)를 참고해 새로 작성, 각 문서 끝에 출처 표기
- 체스 엔진: [Stockfish.js](https://github.com/nmrugg/stockfish.js) 18 (GPL-3). 앱과 분리된 별도 프로그램으로 `public/engine/`에 라이선스 전문과 함께 들어 있습니다.

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 새로운 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요
