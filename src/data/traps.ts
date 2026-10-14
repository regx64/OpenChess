/**
 * 오프닝 함정 모음. 모든 수순과 결말(메이트·기물 이득)은 단위 테스트(src/lib/training/traps.test.ts)에서 chess.js로 확인합니다.
 */
export interface Trap {
  id: string;
  title: string;
  /** 함정을 거는 쪽 */
  trapper: "w" | "b";
  /** 실수 수부터 결말까지 포함한 전체 수순 */
  pgn: string;
  /** 실수 수의 위치 (0부터 센 반수 번호) */
  blunderPly: number;
  /** 실수 수 (SAN, 검증용) */
  blunder: string;
  /** 실수 대신 둘 만한 수 (확실한 경우만) */
  safe?: string;
  /** 결말: 메이트 / 기물 이득 / 기물이 갇힘 */
  outcome: "mate" | "material" | "trapped";
  /** 한 줄 요약 */
  summary: string;
  /** 무엇을 배워야 하는지 */
  lesson: string;
}

export const TRAPS: Trap[] = [
  {
    id: "scholars-mate",
    title: "학자의 메이트",
    trapper: "w",
    pgn: "1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#",
    blunderPly: 5,
    blunder: "Nf6",
    safe: "g6",
    outcome: "mate",
    summary:
      "퀸과 비숍이 함께 f7을 노리는데, 흑이 퀸을 쫓으려고 Nf6을 두면 Qxf7#로 끝납니다.",
    lesson:
      "초반에 f7(백은 f2)은 킹만 지키는 약점입니다. 3...g6이나 3...Qe7로 f7을 지키세요.",
  },
  {
    id: "fools-mate",
    title: "바보의 메이트",
    trapper: "b",
    pgn: "1. f3 e5 2. g4 Qh4#",
    blunderPly: 2,
    blunder: "g4",
    safe: "e4",
    outcome: "mate",
    summary:
      "가능한 가장 빠른 체크메이트입니다. 백이 f폰과 g폰을 밀어 e1–h4 대각선을 열어 줍니다.",
    lesson: "킹 앞 f·g폰을 함부로 밀면 대각선이 열립니다.",
  },
  {
    id: "legals-mate",
    title: "레갈의 메이트",
    trapper: "w",
    pgn: "1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#",
    blunderPly: 9,
    blunder: "Bxd1",
    safe: "dxe5",
    outcome: "mate",
    summary:
      "백이 퀸을 내주는 듯 Nxe5를 두고, 흑이 퀸을 잡으면 마이너 기물 셋으로 메이트합니다.",
    lesson:
      "핀이 걸린 것처럼 보이는 기물도 움직일 수 있습니다. 공짜 퀸을 잡기 전에 상대의 체크를 먼저 확인하세요.",
  },
  {
    id: "blackburne-shilling",
    title: "블랙번 실링 갬빗 함정",
    trapper: "b",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#",
    blunderPly: 8,
    blunder: "Nxf7",
    safe: "Bxf7+",
    outcome: "mate",
    summary:
      "흑이 e5 폰을 내주는 척하고, 백이 욕심내 f7 포크까지 노리면 g2를 잡고 스머더드 메이트에 가까운 Nf3#으로 끝납니다.",
    lesson:
      "3...Nd4는 원래 좋지 않은 수지만 4. Nxe5?로 덥석 잡으면 위험합니다. 4. Nxd4나 4. O-O가 간단합니다.",
  },
  {
    id: "noahs-ark",
    title: "노아의 방주 트랩",
    trapper: "b",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 d6 5. d4 b5 6. Bb3 Nxd4 7. Nxd4 exd4 8. Qxd4 c5 9. Qd5 Be6 10. Qc6+ Bd7 11. Qd5 c4",
    blunderPly: 14,
    blunder: "Qxd4",
    safe: "c3",
    outcome: "trapped",
    summary:
      "루이 로페즈에서 흑 폰들(a6·b5·c5·c4)이 b3 비숍을 가둡니다. 비숍은 어디로 가도 폰에게 잡힙니다.",
    lesson:
      "b3 비숍은 ...a6·...b5·...c5·...c4 폰 사슬에 갇히기 쉽습니다. 8. c3으로 폰을 갬빗하는 것이 정석입니다.",
  },
  {
    id: "elephant-trap",
    title: "엘리펀트 트랩",
    trapper: "b",
    pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. cxd5 exd5 6. Nxd5 Nxd5 7. Bxd8 Bb4+ 8. Qd2 Bxd2+ 9. Kxd2 Kxd8",
    blunderPly: 10,
    blunder: "Nxd5",
    safe: "e3",
    outcome: "material",
    summary:
      "f6 나이트가 핀에 걸린 것 같지만, 백이 d5 폰을 잡으면 흑은 퀸을 내주고 Bb4+로 되찾아 기물 하나를 얻습니다.",
    lesson:
      "퀸즈 갬빗 거절의 4...Nbd7 배치에서 d5 폰은 겉보기와 달리 지켜지고 있습니다.",
  },
  {
    id: "lasker-trap",
    title: "라스커 트랩",
    trapper: "b",
    pgn: "1. d4 d5 2. c4 e5 3. dxe5 d4 4. e3 Bb4+ 5. Bd2 dxe3 6. Bxb4 exf2+ 7. Ke2 fxg1=N+ 8. Rxg1 Bg4+ 9. Ke1 Bxd1",
    blunderPly: 10,
    blunder: "Bxb4",
    safe: "fxe3",
    outcome: "material",
    summary:
      "알빈 카운터갬빗에서 백이 비숍을 잡으면, 흑 폰이 나이트로 승격하며 체크하고 Bg4+로 퀸까지 얻습니다. d열이 열려 있어 백은 d1의 비숍을 되잡을 수도 없습니다.",
    lesson:
      "언더프로모션(나이트 승격)이 최선인 드문 예입니다. 4. e3 대신 4. Nf3이 정석입니다.",
  },
  {
    id: "siberian-trap",
    title: "시베리안 트랩",
    trapper: "b",
    pgn: "1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 e6 6. Bc4 Qc7 7. O-O Nf6 8. Qe2 Ng4 9. h3 Nd4 10. Nxd4 Qh2#",
    blunderPly: 16,
    blunder: "h3",
    outcome: "mate",
    summary:
      "스미스-모라 갬빗에서 백이 습관처럼 h3으로 나이트를 쫓으면 ...Nd4!로 e2 퀸을 공격하며 h2 메이트를 노립니다.",
    lesson:
      "상대 퀸과 나이트가 h2를 함께 노리고 있을 때 h폰을 움직이면 안 됩니다.",
  },
  {
    id: "mortimer-trap",
    title: "모티머 트랩",
    trapper: "b",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Ne7 5. Nxe5 c6 6. Ba4 Qa5+ 7. c3 Qxe5",
    blunderPly: 8,
    blunder: "Nxe5",
    safe: "O-O",
    outcome: "material",
    summary:
      "흑이 e5 폰을 일부러 내주고, 백이 잡으면 ...c6과 ...Qa5+로 나이트를 되찾아 기물을 얻습니다.",
    lesson: "체크와 함께 두 기물을 동시에 노리는 퀸 포크를 늘 조심하세요.",
  },
  {
    id: "englund-trap",
    title: "잉글룬드 갬빗 함정",
    trapper: "b",
    pgn: "1. d4 e5 2. dxe5 Nc6 3. Nf3 Qe7 4. Bf4 Qb4+ 5. Bd2 Qxb2 6. Bc3 Bb4 7. Qd2 Bxc3 8. Qxc3 Qc1#",
    blunderPly: 10,
    blunder: "Bc3",
    outcome: "mate",
    summary:
      "흑 퀸이 b2를 잡고 a1 룩을 노릴 때 백이 Bc3으로 막으면, ...Bb4!로 비숍을 없애고 c1에서 메이트합니다.",
    lesson: "퀸 쪽 1랭크가 비어 있을 때 상대 퀸의 침투를 조심하세요.",
  },
  {
    id: "caro-kann-smothered",
    title: "카로칸 스머더드 메이트",
    trapper: "w",
    pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Qe2 Ngf6 6. Nd6#",
    blunderPly: 9,
    blunder: "Ngf6",
    safe: "Ndf6",
    outcome: "mate",
    summary:
      "e7 폰이 e2 퀸에 핀이 걸려 있어, 흑이 g8 나이트로 Nf6을 두면 Nd6#로 끝납니다.",
    lesson:
      "킹이 e열에서 상대 퀸과 마주 보고 있으면 e폰이 핀에 걸려 있습니다. 5...Ndf6이 정석입니다.",
  },
  {
    id: "petrov-discovered",
    title: "페트로프 디스커버드 체크",
    trapper: "w",
    pgn: "1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nxe4 4. Qe2 Nf6 5. Nc6+ Be7 6. Nxd8 Kxd8",
    blunderPly: 7,
    blunder: "Nf6",
    safe: "Qe7",
    outcome: "material",
    summary:
      "페트로프에서 대칭으로 따라 두다가 e열이 열린 채 나이트를 물리면, Nc6+ 디스커버드 체크로 퀸을 잃습니다.",
    lesson:
      "3...Nxe4?는 실수이고 3...d6이 정석입니다. e열에 두 킹이 마주 볼 때는 디스커버드 체크를 조심하세요.",
  },
  {
    id: "kieninger-trap",
    title: "키닝거 트랩",
    trapper: "b",
    pgn: "1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4 Nc6 5. Nf3 Bb4+ 6. Nbd2 Qe7 7. a3 Ngxe5 8. axb4 Nd3#",
    blunderPly: 14,
    blunder: "axb4",
    safe: "Nxe5",
    outcome: "mate",
    summary:
      "부다페스트 갬빗에서 백이 비숍을 잡으면 d3에서 나이트 메이트가 나옵니다. 백 킹 주변 칸이 모두 자기 기물로 막혀 있어 피할 곳이 없습니다.",
    lesson:
      "자기 기물이 킹의 피할 칸을 막고 있으면 나이트 체크 한 번이 메이트가 될 수 있습니다.",
  },
  {
    id: "halosar-trap",
    title: "할로사르 트랩",
    trapper: "w",
    pgn: "1. d4 d5 2. e4 dxe4 3. Nc3 Nf6 4. f3 exf3 5. Qxf3 Qxd4 6. Be3 Qb4 7. O-O-O Bg4 8. Nb5 Bxf3 9. Nxc7#",
    blunderPly: 15,
    blunder: "Bxf3",
    outcome: "mate",
    summary:
      "블랙마–디머 갬빗에서 흑이 퀸을 잡으면 Nxc7#가 나옵니다. d열의 룩이 흑 킹의 피할 칸을 막습니다.",
    lesson: "상대가 퀸을 내줄 때는 대가가 무엇인지 먼저 계산하세요.",
  },
];
